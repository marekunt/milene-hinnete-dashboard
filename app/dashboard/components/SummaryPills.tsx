'use client'

import { GradeWithStatus } from '@/types'
import { getDeadlineStatus } from '@/lib/gradeUtils'

interface SummaryPillsProps {
  grades: GradeWithStatus[]
  activeFilter: string
  onFilterChange: (f: 'all' | 'deadline' | 'done') => void
}

export default function SummaryPills({ grades, activeFilter, onFilterChange }: SummaryPillsProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const urgent = grades.filter(
    (g) => g.status !== 'done' && getDeadlineStatus(g.deadline, g.status) === 'urgent'
  ).length

  const soon = grades.filter(
    (g) => g.status !== 'done' && getDeadlineStatus(g.deadline, g.status) === 'soon'
  ).length

  const open = grades.filter((g) => g.status !== 'done').length
  const done = grades.filter((g) => g.status === 'done').length

  const pills = [
    {
      id: 'all',
      emoji: '⚪',
      label: `${open} avatud`,
      active: activeFilter === 'all',
    },
    {
      id: 'deadline',
      emoji: urgent > 0 ? '🔴' : '🟡',
      label:
        urgent > 0
          ? `${urgent} tähtaeg täna/homme`
          : `${soon} tähtaeg sel nädalal`,
      active: activeFilter === 'deadline',
    },
    {
      id: 'done',
      emoji: '✓',
      label: `${done} tehtud`,
      active: activeFilter === 'done',
    },
  ]

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-4 py-3 min-w-max">
        {pills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => onFilterChange(pill.id as 'all' | 'deadline' | 'done')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              pill.active
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <span>{pill.emoji}</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
