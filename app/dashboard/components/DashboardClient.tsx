'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { GradeWithStatus, UserRole } from '@/types'
import { markDone, addNote, signOut } from '../actions'
import { getDeadlineStatus } from '@/lib/gradeUtils'
import GradeCard from './GradeCard'
import BottomSheet from './BottomSheet'
import SummaryPills from './SummaryPills'

type FilterType = 'all' | 'deadline' | 'done'

interface DashboardClientProps {
  grades: GradeWithStatus[]
  role: UserRole
  userInitials: string
}

export default function DashboardClient({ grades, role, userInitials }: DashboardClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [bottomSheetGradeId, setBottomSheetGradeId] = useState<string | null>(null)
  const [doneExpanded, setDoneExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Optimistic updates: track grade IDs that are being marked done
  const [optimisticGrades, addOptimistic] = useOptimistic(
    grades,
    (
      state: GradeWithStatus[],
      update: { gradeId: string; patch: Partial<GradeWithStatus> }
    ) => state.map((g) => (g.id === update.gradeId ? { ...g, ...update.patch } : g))
  )

  function handleToggle(id: string) {
    setExpandedCardId((prev) => (prev === id ? null : id))
  }

  function handleMarkDone(gradeId: string) {
    startTransition(async () => {
      addOptimistic({ gradeId, patch: { status: 'done', resolved_at: new Date().toISOString(), updated_by: role } })
      setExpandedCardId(null)
      await markDone(gradeId, role)
    })
  }

  function handleOpenNote(gradeId: string) {
    setBottomSheetGradeId(gradeId)
  }

  function handleCloseNote() {
    setBottomSheetGradeId(null)
  }

  async function handleSaveNote(note: string) {
    if (!bottomSheetGradeId) return
    const grade = optimisticGrades.find((g) => g.id === bottomSheetGradeId)
    if (!grade) return

    startTransition(async () => {
      addOptimistic({ gradeId: bottomSheetGradeId, patch: { note, updated_by: role } })
      setBottomSheetGradeId(null)
      await addNote(bottomSheetGradeId, note, role, grade.status)
    })
  }

  async function handleSignOut() {
    await signOut()
    window.location.href = '/login'
  }

  // Filter logic
  const activeGrades = optimisticGrades.filter((g) => g.status !== 'done')
  const doneGrades = optimisticGrades.filter((g) => g.status === 'done')

  let displayedGrades: GradeWithStatus[]
  if (activeFilter === 'done') {
    displayedGrades = doneGrades
  } else if (activeFilter === 'deadline') {
    displayedGrades = activeGrades.filter((g) => {
      const ds = getDeadlineStatus(g.deadline, g.status)
      return ds === 'urgent' || ds === 'soon'
    })
  } else {
    displayedGrades = activeGrades
  }

  // Sort: urgent first, then by deadline asc, then by created_at desc
  displayedGrades = [...displayedGrades].sort((a, b) => {
    const order = { urgent: 0, soon: 1, none: 2, done: 3 }
    const aStatus = getDeadlineStatus(a.deadline, a.status)
    const bStatus = getDeadlineStatus(b.deadline, b.status)
    if (order[aStatus] !== order[bStatus]) return order[aStatus] - order[bStatus]
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Group by subject
  const grouped = displayedGrades.reduce<Record<string, GradeWithStatus[]>>((acc, g) => {
    if (!acc[g.subject]) acc[g.subject] = []
    acc[g.subject].push(g)
    return acc
  }, {})

  const bottomSheetGrade = optimisticGrades.find((g) => g.id === bottomSheetGradeId)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-bold">Milene hinded</h1>
          <button
            onClick={handleSignOut}
            className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center active:bg-blue-700"
            title="Logi välja"
            aria-label="Logi välja"
          >
            {userInitials}
          </button>
        </div>
      </header>

      {/* Summary pills */}
      <SummaryPills
        grades={optimisticGrades}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Filter tabs */}
      <div className="max-w-lg mx-auto px-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['all', 'deadline', 'done'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {f === 'all' ? 'Kõik' : f === 'deadline' ? 'Tähtaeg läheneb' : 'Tehtud'}
            </button>
          ))}
        </div>
      </div>

      {/* Card list */}
      <main className="max-w-lg mx-auto px-4">
        {activeFilter !== 'done' && (
          <>
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm">Kõik korras!</p>
              </div>
            ) : (
              Object.entries(grouped).map(([subject, subjectGrades]) => (
                <div key={subject} className="mb-5">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                    {subject}
                    <span className="ml-1.5 text-gray-300">({subjectGrades.length})</span>
                  </h2>
                  <div className="space-y-2">
                    {subjectGrades.map((grade) => (
                      <GradeCard
                        key={grade.id}
                        grade={grade}
                        isExpanded={expandedCardId === grade.id}
                        onToggle={() => handleToggle(grade.id)}
                        onMarkDone={() => handleMarkDone(grade.id)}
                        onAddNote={() => handleOpenNote(grade.id)}
                        isPending={isPending}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Done section (collapsible) */}
            {activeFilter === 'all' && doneGrades.length > 0 && (
              <div className="mt-6 mb-4">
                <button
                  onClick={() => setDoneExpanded((v) => !v)}
                  className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-2 px-1 w-full"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${doneExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Tehtud ({doneGrades.length})
                </button>

                {doneExpanded && (
                  <div className="space-y-2">
                    {doneGrades.map((grade) => (
                      <GradeCard
                        key={grade.id}
                        grade={grade}
                        isExpanded={expandedCardId === grade.id}
                        onToggle={() => handleToggle(grade.id)}
                        onMarkDone={() => handleMarkDone(grade.id)}
                        onAddNote={() => handleOpenNote(grade.id)}
                        isPending={isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeFilter === 'done' && (
          <>
            {doneGrades.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm">Tehtud ülesandeid pole veel.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {doneGrades.map((grade) => (
                  <GradeCard
                    key={grade.id}
                    grade={grade}
                    isExpanded={expandedCardId === grade.id}
                    onToggle={() => handleToggle(grade.id)}
                    onMarkDone={() => handleMarkDone(grade.id)}
                    onAddNote={() => handleOpenNote(grade.id)}
                    isPending={isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Note bottom sheet */}
      <BottomSheet
        isOpen={!!bottomSheetGradeId}
        onClose={handleCloseNote}
        onSave={handleSaveNote}
        title={bottomSheetGrade ? `Märkus: ${bottomSheetGrade.subject}` : 'Lisa märkus'}
        isPending={isPending}
      />
    </div>
  )
}
