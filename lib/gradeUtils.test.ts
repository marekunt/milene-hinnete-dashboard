import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDeadlineStatus,
  getBorderClass,
  getGradeBadgeClass,
  formatDate,
  formatRelativeTime,
} from './gradeUtils'

// Helper: returns YYYY-MM-DD string relative to today
function daysFromToday(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ─── getDeadlineStatus ────────────────────────────────────────────────────────

describe('getDeadlineStatus', () => {
  it('returns "done" for any deadline when status is done', () => {
    expect(getDeadlineStatus(daysFromToday(10), 'done')).toBe('done')
    expect(getDeadlineStatus(null, 'done')).toBe('done')
    expect(getDeadlineStatus(daysFromToday(-5), 'done')).toBe('done')
  })

  it('returns "urgent" for deadline today', () => {
    expect(getDeadlineStatus(daysFromToday(0), 'open')).toBe('urgent')
  })

  it('returns "urgent" for deadline tomorrow', () => {
    expect(getDeadlineStatus(daysFromToday(1), 'open')).toBe('urgent')
  })

  it('returns "soon" for deadline in 3 days', () => {
    expect(getDeadlineStatus(daysFromToday(3), 'open')).toBe('soon')
  })

  it('returns "soon" for deadline in 7 days', () => {
    expect(getDeadlineStatus(daysFromToday(7), 'open')).toBe('soon')
  })

  it('returns "none" for deadline in 8 days', () => {
    expect(getDeadlineStatus(daysFromToday(8), 'open')).toBe('none')
  })

  it('returns "none" for null deadline', () => {
    expect(getDeadlineStatus(null, 'open')).toBe('none')
  })

  it('returns "none" for a deadline in the past', () => {
    expect(getDeadlineStatus(daysFromToday(-3), 'open')).toBe('none')
  })
})

// ─── getBorderClass ───────────────────────────────────────────────────────────

describe('getBorderClass', () => {
  it('returns green for done', () => {
    expect(getBorderClass('done')).toContain('green')
  })

  it('returns red color for urgent', () => {
    expect(getBorderClass('urgent')).toContain('E24B4A')
  })

  it('returns amber color for soon', () => {
    expect(getBorderClass('soon')).toContain('EF9F27')
  })

  it('returns gray for none', () => {
    expect(getBorderClass('none')).toContain('gray')
  })
})

// ─── getGradeBadgeClass ───────────────────────────────────────────────────────

describe('getGradeBadgeClass', () => {
  it('returns green when status is done regardless of grade', () => {
    expect(getGradeBadgeClass('0', 'done')).toContain('green')
    expect(getGradeBadgeClass('MA', 'done')).toContain('green')
  })

  it.each(['0', '1', '1*', 'MA', 'MA*', 'ma', 'ma*'])(
    'returns red for failing grade "%s"',
    (grade) => {
      expect(getGradeBadgeClass(grade, 'open')).toContain('red')
    }
  )

  it('returns amber for grade 2', () => {
    expect(getGradeBadgeClass('2', 'open')).toContain('amber')
  })

  it('returns amber for a fraction below 60% (7/14 = 50%)', () => {
    expect(getGradeBadgeClass('7/14', 'open')).toContain('amber')
  })

  it('returns yellow for a fraction above 60% (10/14 ≈ 71%)', () => {
    expect(getGradeBadgeClass('10/14', 'open')).toContain('yellow')
  })

  it('returns gray (neutral) for a normal passing grade like 4', () => {
    const cls = getGradeBadgeClass('4', 'open')
    expect(cls).toContain('gray')
    expect(cls).not.toContain('red')
    expect(cls).not.toContain('amber')
  })
})

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date in Estonian DD.MM.YYYY style', () => {
    expect(formatDate('2026-03-17')).toBe('17.03.2026')
  })

  it('formats single-digit day and month with leading zeros', () => {
    expect(formatDate('2026-01-05')).toBe('05.01.2026')
  })

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })
})

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  let now: number

  beforeEach(() => {
    now = Date.now()
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty string for null', () => {
    expect(formatRelativeTime(null)).toBe('')
  })

  it('returns "just now" for timestamps less than 1 minute ago', () => {
    const ts = new Date(now - 30 * 1000).toISOString()
    expect(formatRelativeTime(ts)).toBe('just now')
  })

  it('returns "5 min tagasi" for 5 minutes ago', () => {
    const ts = new Date(now - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(ts)).toBe('5 min tagasi')
  })

  it('returns "3 t tagasi" for 3 hours ago', () => {
    const ts = new Date(now - 3 * 3600 * 1000).toISOString()
    expect(formatRelativeTime(ts)).toBe('3 t tagasi')
  })

  it('returns "2 p tagasi" for 2 days ago', () => {
    const ts = new Date(now - 2 * 86400 * 1000).toISOString()
    expect(formatRelativeTime(ts)).toBe('2 p tagasi')
  })

  it('returns a formatted date for timestamps older than 7 days', () => {
    const ts = new Date(now - 10 * 86400 * 1000).toISOString()
    const result = formatRelativeTime(ts)
    // Should be a date string, not a relative expression
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })
})
