export type GradeStatus = 'open' | 'done' | 'wont_fix'

export interface Grade {
  id: string
  subject: string
  grade: string
  grade_type: string | null
  graded_at: string | null
  deadline: string | null
  description: string | null
  raw_email_text: string | null
  created_at: string
}

export interface GradeStatusEntry {
  id: string
  grade_id: string
  status: GradeStatus
  note: string | null
  updated_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface GradeWithStatus extends Grade {
  status: GradeStatus
  status_id: string | null
  note: string | null
  updated_by: string | null
  resolved_at: string | null
  status_created_at: string | null
}

export type UserRole = 'parent' | 'milene'
