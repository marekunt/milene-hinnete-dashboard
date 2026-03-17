'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Grade, GradeStatus } from '@/types'

type GradePatch = Partial<Pick<Grade, 'grade' | 'grade_type' | 'graded_at' | 'deadline' | 'description'>>

export async function updateGrade(gradeId: string, patch: GradePatch) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('grades').update(patch).eq('id', gradeId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function reopenGrade(gradeId: string, updatedBy: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('grade_status').insert({
    grade_id: gradeId,
    status: 'open' as GradeStatus,
    updated_by: updatedBy,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function markWontFix(gradeId: string, updatedBy: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('grade_status').insert({
    grade_id: gradeId,
    status: 'wont_fix' as GradeStatus,
    updated_by: updatedBy,
    resolved_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function markDone(gradeId: string, updatedBy: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('grade_status').insert({
    grade_id: gradeId,
    status: 'done' as GradeStatus,
    updated_by: updatedBy,
    resolved_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function addNote(
  gradeId: string,
  note: string,
  updatedBy: string,
  currentStatus: GradeStatus
) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('grade_status').insert({
    grade_id: gradeId,
    status: currentStatus,
    note: note.trim(),
    updated_by: updatedBy,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function deleteGrade(gradeId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('grades').delete().eq('id', gradeId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function signOut() {
  cookies().delete('mh-auth')
  redirect('/login')
}
