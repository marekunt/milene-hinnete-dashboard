import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseEmailWithClaude, ParsedGrade } from '@/lib/parseEmail'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  // Validate webhook secret (passed as query param ?secret=... since Postmark doesn't support custom headers)
  const webhookSecret = request.nextUrl.searchParams.get('secret')
  if (
    process.env.POSTMARK_WEBHOOK_SECRET &&
    webhookSecret !== process.env.POSTMARK_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { TextBody?: string; Subject?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawEmailText = body.TextBody
  if (!rawEmailText) {
    return NextResponse.json({ error: 'Missing TextBody' }, { status: 400 })
  }

  let parsed: ParsedGrade | ParsedGrade[]
  try {
    parsed = await parseEmailWithClaude(rawEmailText)
  } catch (err) {
    console.error('Claude parse error:', err)
    return NextResponse.json({ error: 'Failed to parse email' }, { status: 500 })
  }

  const grades = Array.isArray(parsed) ? parsed : [parsed]
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
        raw_email_text: rawEmailText,
      })
      .select('id')
      .single()

    if (gradeError) {
      console.error('Supabase insert error:', gradeError)
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
    }

    // Create initial open status
    const { error: statusError } = await supabase.from('grade_status').insert({
      grade_id: gradeRow.id,
      status: 'open',
      updated_by: 'system',
    })

    if (statusError) {
      console.error('Status insert error:', statusError)
    }
  }

  return NextResponse.json({ ok: true, count: grades.length })
}
