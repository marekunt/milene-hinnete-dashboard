'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GradeStatus } from '@/types'

export async function markDone(gradeId: string, updatedBy: string) {
  const supabase = createServerClient()
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
  const supabase = createServerClient()
  const { error } = await supabase.from('grade_status').insert({
    grade_id: gradeId,
    status: currentStatus,
    note: note.trim(),
    updated_by: updatedBy,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
