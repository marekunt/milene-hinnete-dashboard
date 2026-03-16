import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GradeWithStatus } from '@/types'
import DashboardClient from './components/DashboardClient'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userEmail = session.user.email ?? ''
  const allowedEmails = [
    process.env.ALLOWED_EMAIL_PARENT,
    process.env.ALLOWED_EMAIL_STUDENT,
  ].filter(Boolean)

  if (!allowedEmails.includes(userEmail)) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  const role = userEmail === process.env.ALLOWED_EMAIL_PARENT ? 'parent' : 'milene'
  const userInitials = userEmail.charAt(0).toUpperCase()

  // Fetch grades
  const { data: gradesData, error: gradesError } = await supabase
    .from('grades')
    .select('*')
    .order('created_at', { ascending: false })

  if (gradesError) throw new Error(gradesError.message)

  // Fetch all grade statuses (ordered descending so first per grade = latest)
  const { data: statusData } = await supabase
    .from('grade_status')
    .select('*')
    .order('created_at', { ascending: false })

  // Build map: grade_id -> latest status entry
  const statusMap = new Map<string, (typeof statusData)[0]>()
  statusData?.forEach((s) => {
    if (!statusMap.has(s.grade_id)) {
      statusMap.set(s.grade_id, s)
    }
  })

  const grades: GradeWithStatus[] = (gradesData ?? []).map((g) => {
    const s = statusMap.get(g.id)
    return {
      ...g,
      status: (s?.status ?? 'open') as GradeWithStatus['status'],
      status_id: s?.id ?? null,
      note: s?.note ?? null,
      updated_by: s?.updated_by ?? null,
      resolved_at: s?.resolved_at ?? null,
      status_created_at: s?.created_at ?? null,
    }
  })

  return <DashboardClient grades={grades} role={role} userInitials={userInitials} />
}
