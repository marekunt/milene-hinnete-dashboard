import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GradeCard from './GradeCard'
import { GradeWithStatus } from '@/types'

// Helper: builds a minimal GradeWithStatus fixture
function makeGrade(overrides: Partial<GradeWithStatus> = {}): GradeWithStatus {
  return {
    id: 'grade-1',
    subject: 'Matemaatika',
    grade: '0',
    grade_type: 'Hindeline ülesanne',
    graded_at: '2026-03-13',
    deadline: null,
    description: 'Teadmiste kontroll on tegemata. Järelvastamine võimalik 23.03 või 30.03.',
    raw_email_text: null,
    created_at: '2026-03-13T10:00:00Z',
    status: 'open',
    status_id: 'status-1',
    note: null,
    updated_by: null,
    resolved_at: null,
    status_created_at: null,
    ...overrides,
  }
}

function daysFromToday(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('GradeCard — collapsed state', () => {
  it('renders subject, grade badge, and grade type', () => {
    render(
      <GradeCard
        grade={makeGrade()}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.getByText('Matemaatika')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Hindeline ülesanne')).toBeInTheDocument()
  })

  it('does not show action buttons when collapsed', () => {
    render(
      <GradeCard
        grade={makeGrade()}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.queryByText('Märgi tehtud')).not.toBeInTheDocument()
    expect(screen.queryByText('Lisa märkus')).not.toBeInTheDocument()
  })
})

describe('GradeCard — expanded state', () => {
  it('shows action buttons when expanded', () => {
    render(
      <GradeCard
        grade={makeGrade()}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.getByText('Märgi tehtud')).toBeInTheDocument()
    expect(screen.getByText('Lisa märkus')).toBeInTheDocument()
  })

  it('shows graded_at date when expanded', () => {
    render(
      <GradeCard
        grade={makeGrade({ graded_at: '2026-03-13' })}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.getByText('13.03.2026')).toBeInTheDocument()
  })

  it('shows deadline date when expanded', () => {
    render(
      <GradeCard
        grade={makeGrade({ deadline: '2026-03-30' })}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.getByText('30.03.2026')).toBeInTheDocument()
  })

  it('renders note block when grade has a note', () => {
    render(
      <GradeCard
        grade={makeGrade({ note: 'Plaan tehtud sel nädalal', updated_by: 'parent', status_created_at: new Date().toISOString() })}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.getByText(/Plaan tehtud sel nädalal/)).toBeInTheDocument()
    expect(screen.getByText(/Vanem/)).toBeInTheDocument()
  })
})

// ─── Done state ───────────────────────────────────────────────────────────────

describe('GradeCard — done state', () => {
  it('shows ✓ as the grade badge instead of the grade value', () => {
    render(
      <GradeCard
        grade={makeGrade({ status: 'done', resolved_at: new Date().toISOString() })}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('does NOT show action buttons in expanded done card', () => {
    render(
      <GradeCard
        grade={makeGrade({ status: 'done', resolved_at: new Date().toISOString() })}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(screen.queryByText('Märgi tehtud')).not.toBeInTheDocument()
    expect(screen.queryByText('Lisa märkus')).not.toBeInTheDocument()
  })

  it('applies opacity class for done cards', () => {
    const { container } = render(
      <GradeCard
        grade={makeGrade({ status: 'done' })}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    expect(container.firstChild).toHaveClass('opacity-60')
  })
})

// ─── Deadline color ───────────────────────────────────────────────────────────

describe('GradeCard — deadline urgency styling', () => {
  it('applies red border class for an urgent deadline (today)', () => {
    const { container } = render(
      <GradeCard
        grade={makeGrade({ deadline: daysFromToday(0) })}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    const cardEl = container.firstChild as HTMLElement
    expect(cardEl.className).toContain('E24B4A')
  })

  it('applies amber border class for a soon deadline (3 days)', () => {
    const { container } = render(
      <GradeCard
        grade={makeGrade({ deadline: daysFromToday(3) })}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    const cardEl = container.firstChild as HTMLElement
    expect(cardEl.className).toContain('EF9F27')
  })
})

// ─── Interactions ─────────────────────────────────────────────────────────────

describe('GradeCard — interactions', () => {
  it('calls onToggle when the card header is clicked', async () => {
    const onToggle = vi.fn()
    render(
      <GradeCard
        grade={makeGrade()}
        isExpanded={false}
        onToggle={onToggle}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /Matemaatika/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('calls onMarkDone when "Märgi tehtud" is clicked', async () => {
    const onMarkDone = vi.fn()
    render(
      <GradeCard
        grade={makeGrade()}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={onMarkDone}
        onAddNote={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText('Märgi tehtud'))
    expect(onMarkDone).toHaveBeenCalledOnce()
  })

  it('calls onAddNote when "Lisa märkus" is clicked', async () => {
    const onAddNote = vi.fn()
    render(
      <GradeCard
        grade={makeGrade()}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={onAddNote}
      />
    )
    await userEvent.click(screen.getByText('Lisa märkus'))
    expect(onAddNote).toHaveBeenCalledOnce()
  })

  it('disables action buttons when isPending is true', () => {
    render(
      <GradeCard
        grade={makeGrade()}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkDone={vi.fn()}
        onAddNote={vi.fn()}
        isPending={true}
      />
    )
    expect(screen.getByText('Märgi tehtud').closest('button')).toBeDisabled()
    expect(screen.getByText('Lisa märkus').closest('button')).toBeDisabled()
  })
})
