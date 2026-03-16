'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { parseEmailWithClaude, ParsedGrade } from '@/lib/parseEmail'

export async function parseEmail(text: string): Promise<{ result?: ParsedGrade | ParsedGrade[]; error?: string }> {
  try {
    const result = await parseEmailWithClaude(text)
    return { result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Parse error:', msg)
    return { error: `Parsimine ebaõnnestus: ${msg}` }
  }
}

export async function saveGrades(grades: ParsedGrade[], rawText: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createServiceClient()

  for (const grade of grades) {
    const { data: gradeRow, error: gradeError } = await supabase
      .from('grades')
      .insert({
        subject: grade.subject,
        grade: grade.grade,
        grade_type: grade.grade_type || null,
        graded_at: grade.graded_at || null,
        deadline: grade.deadline || null,
        description: grade.description || null,
        raw_email_text: rawText,
      })
      .select('id')
      .single()

    if (gradeError) {
      console.error('Insert error:', gradeError)
      return { error: 'Salvestamine ebaõnnestus.' }
    }

    await supabase.from('grade_status').insert({
      grade_id: gradeRow.id,
      status: 'open',
      updated_by: 'system',
    })
  }

  return { ok: true }
}
