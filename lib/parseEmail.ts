import Anthropic from '@anthropic-ai/sdk'

export interface ParsedGrade {
  subject: string
  grade: string
  grade_type?: string
  graded_at?: string | null
  deadline?: string | null
  description?: string
}

const SYSTEM_PROMPT = `You are a parser for Estonian school grade notification emails from e-kool.ee. Extract grade information and return ONLY valid JSON with no markdown, no explanation, just the raw JSON object.

Return this exact structure:
{
  "subject": "subject name in Estonian",
  "grade": "grade value as string (e.g. 5, MA, 1*, 7/14, 0)",
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

export async function parseEmailWithClaude(text: string): Promise<ParsedGrade | ParsedGrade[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(responseText)
}
