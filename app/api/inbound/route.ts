import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a parser for Estonian school grade notification emails from e-kool.ee. Extract grade information and return ONLY valid JSON with no markdown, no explanation, just the raw JSON object.

Return this exact structure:
{
  "subject": "subject name in Estonian",
  "grade": "grade value as string (e.g. 5, MA, 1*, 7/14)",
  "grade_type": "type of grade entry in Estonian",
  "graded_at": "YYYY-MM-DD or null",
  "deadline": "YYYY-MM-DD or null",
  "description": "full description of the assignment in Estonian, preserving all original text"
}

Rules:
- grade must be the exact grade value shown
- deadline is the last date to fix or resubmit the grade — null if not mentioned
- description must include the full assignment text, teacher comments, and any instructions
- if multiple grades appear in the email, return an array of objects`

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  // Validate webhook secret
  const webhookSecret = request.headers.get('x-postmark-secret')
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

  // Parse with Claude
  let parsed: ParsedGrade | ParsedGrade[]
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rawEmailText }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    parsed = JSON.parse(text)
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

interface ParsedGrade {
  subject: string
  grade: string
  grade_type?: string
  graded_at?: string | null
  deadline?: string | null
  description?: string
}
