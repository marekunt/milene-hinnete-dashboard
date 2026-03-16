import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────
// vi.hoisted() ensures these are defined before vi.mock() hoisting runs.

const mocks = vi.hoisted(() => ({
  mockSingle: vi.fn(),
  mockCreate: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mocks.mockFrom })),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: { create: mocks.mockCreate },
  })),
}))

// Import AFTER mocks are registered
const { POST } = await import('./route')

// ─── Shared helpers ───────────────────────────────────────────────────────────

const VALID_SECRET = 'test-secret'

const SAMPLE_GRADE = {
  subject: 'Eesti keel',
  grade: 'MA',
  grade_type: 'Tunnihinne',
  graded_at: '2026-03-04',
  deadline: '2026-03-17',
  description: 'Jutustav tekst on tegemata.',
}

function makeRequest(body: object, secret?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret !== undefined) headers['x-postmark-secret'] = secret
  return new NextRequest('http://localhost/api/inbound', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function mockClaudeReturns(text: string) {
  mocks.mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text }] })
}

// Re-initialize the Supabase chain mock before each test.
// mockFrom() always returns an object where:
//   .insert().select().single() chains to mocks.mockSingle  (for grades table)
//   .insert() awaited directly resolves to {error: null}    (for grade_status table)
// The grade_status insert is: await supabase.from('grade_status').insert({...})
// Awaiting a non-Promise ({select:...}) resolves to the object itself, so
// destructuring gives statusError = undefined, which is treated as no error.
function setupSupabaseMock() {
  mocks.mockFrom.mockImplementation(() => ({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: mocks.mockSingle }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  setupSupabaseMock()
  process.env.POSTMARK_WEBHOOK_SECRET = VALID_SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
})

// ─── Auth validation ──────────────────────────────────────────────────────────

describe('POST /api/inbound — auth', () => {
  it('returns 401 when X-Postmark-Secret is wrong', async () => {
    const res = await POST(makeRequest({ TextBody: 'hello' }, 'wrong-secret'))
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 401 when X-Postmark-Secret is missing', async () => {
    const res = await POST(makeRequest({ TextBody: 'hello' }))
    expect(res.status).toBe(401)
  })

  it('proceeds past auth check with correct secret', async () => {
    mockClaudeReturns(JSON.stringify(SAMPLE_GRADE))
    mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'grade-1' }, error: null })

    const res = await POST(makeRequest({ TextBody: 'email body' }, VALID_SECRET))
    expect(res.status).not.toBe(401)
  })
})

// ─── Payload validation ───────────────────────────────────────────────────────

describe('POST /api/inbound — payload validation', () => {
  it('returns 400 when TextBody is missing', async () => {
    const res = await POST(makeRequest({ Subject: 'no body' }, VALID_SECRET))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Missing TextBody' })
  })

  it('returns 400 for an invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/inbound', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-postmark-secret': VALID_SECRET },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('POST /api/inbound — happy path', () => {
  it('inserts a single grade and returns { ok: true, count: 1 }', async () => {
    mockClaudeReturns(JSON.stringify(SAMPLE_GRADE))
    mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'grade-1' }, error: null })

    const res = await POST(makeRequest({ TextBody: 'email text' }, VALID_SECRET))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, count: 1 })
  })

  it('inserts multiple grades when Claude returns an array and returns count: 2', async () => {
    const twoGrades = [
      { ...SAMPLE_GRADE },
      { subject: 'Matemaatika', grade: '0', grade_type: 'Kontrolltöö', graded_at: '2026-03-13', deadline: null, description: 'B' },
    ]
    mockClaudeReturns(JSON.stringify(twoGrades))
    mocks.mockSingle
      .mockResolvedValueOnce({ data: { id: 'grade-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'grade-2' }, error: null })

    const res = await POST(makeRequest({ TextBody: 'multi email' }, VALID_SECRET))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, count: 2 })
  })
})

// ─── Error handling ───────────────────────────────────────────────────────────

describe('POST /api/inbound — error handling', () => {
  it('returns 500 when Claude returns malformed JSON', async () => {
    mockClaudeReturns('this is not json { broken')
    const res = await POST(makeRequest({ TextBody: 'email' }, VALID_SECRET))
    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({ error: 'Failed to parse email' })
  })

  it('returns 500 when Supabase insert fails', async () => {
    mockClaudeReturns(JSON.stringify(SAMPLE_GRADE))
    mocks.mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    const res = await POST(makeRequest({ TextBody: 'email' }, VALID_SECRET))
    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({ error: 'Database insert failed' })
  })
})
