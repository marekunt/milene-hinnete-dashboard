import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { GradeWithStatus } from '@/types'
import DashboardClient from './components/DashboardClient'

export default async function DashboardPage() {
  const userEmail = cookies().get('mh-auth')?.value
  if (!userEmail) redirect('/login')

  const role = userEmail === process.env.ALLOWED_EMAIL_PARENT ? 'parent' : 'milene'
  const userInitials = userEmail.charAt(0).toUpperCase()

  let supabase: ReturnType<typeof createServiceClient>
  try {
    supabase = createServiceClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return <pre className="p-4 text-red-600 text-xs">createServiceClient error: {msg}</pre>
  }

  // Fetch grades
  const { data: gradesData, error: gradesError } = await supabase
    .from('grades')
    .select('*')
    .order('created_at', { ascending: false })

  if (gradesError) {
    return <pre className="p-4 text-red-600 text-xs">gradesError: {gradesError.message} | code: {gradesError.code}</pre>
  }

  // Fetch all grade statuses (ordered descending so first per grade = latest)
  const { data: statusData, error: statusError } = await supabase
    .from('grade_status')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusError) {
    return <pre className="p-4 text-red-600 text-xs">statusError: {statusError.message} | code: {statusError.code}</pre>
  }

  // Build map: grade_id -> latest status entry
  type StatusRow = NonNullable<typeof statusData>[0]
  const statusMap = new Map<string, StatusRow>()
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
