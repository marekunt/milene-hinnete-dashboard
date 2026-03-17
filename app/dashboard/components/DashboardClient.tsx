'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { GradeWithStatus, Grade, UserRole } from '@/types'
import { markDone, addNote, updateGrade, reopenGrade, markWontFix, deleteGrade, signOut } from '../actions'
import { getDeadlineStatus } from '@/lib/gradeUtils'
import GradeCard from './GradeCard'
import BottomSheet from './BottomSheet'
import EditSheet from './EditSheet'
import SummaryPills from './SummaryPills'

type FilterType = 'all' | 'deadline' | 'done'
type SortType = 'deadline' | 'date'
type GradePatch = Partial<Pick<Grade, 'grade' | 'grade_type' | 'graded_at' | 'deadline' | 'description'>>

interface DashboardClientProps {
  grades: GradeWithStatus[]
  role: UserRole
  userInitials: string
}

export default function DashboardClient({ grades, role, userInitials }: DashboardClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('deadline')
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [bottomSheetGradeId, setBottomSheetGradeId] = useState<string | null>(null)
  const [editSheetGradeId, setEditSheetGradeId] = useState<string | null>(null)
  const [doneExpanded, setDoneExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [optimisticGrades, addOptimistic] = useOptimistic(
    grades,
    (
      state: GradeWithStatus[],
      update:
        | { type: 'delete'; gradeId: string }
        | { type: 'patch'; gradeId: string; patch: Partial<GradeWithStatus> }
    ) => {
      if (update.type === 'delete') return state.filter((g) => g.id !== update.gradeId)
      return state.map((g) => (g.id === update.gradeId ? { ...g, ...update.patch } : g))
    }
  )

  function handleToggle(id: string) {
    setExpandedCardId((prev) => (prev === id ? null : id))
  }

  function handleMarkDone(gradeId: string) {
    startTransition(async () => {
      addOptimistic({ type: 'patch', gradeId, patch: { status: 'done', resolved_at: new Date().toISOString(), updated_by: role } })
      setExpandedCardId(null)
      await markDone(gradeId, role)
    })
  }

  function handleReopen(gradeId: string) {
    startTransition(async () => {
      addOptimistic({ type: 'patch', gradeId, patch: { status: 'open', resolved_at: null, updated_by: role } })
      setExpandedCardId(null)
      await reopenGrade(gradeId, role)
    })
  }

  function handleWontFix(gradeId: string) {
    startTransition(async () => {
      addOptimistic({ type: 'patch', gradeId, patch: { status: 'wont_fix', resolved_at: new Date().toISOString(), updated_by: role } })
      setExpandedCardId(null)
      await markWontFix(gradeId, role)
    })
  }

  function handleDelete(gradeId: string) {
    startTransition(async () => {
      addOptimistic({ type: 'delete', gradeId })
      setExpandedCardId(null)
      await deleteGrade(gradeId)
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
      addOptimistic({ type: 'patch', gradeId: bottomSheetGradeId, patch: { note, updated_by: role } })
      setBottomSheetGradeId(null)
      await addNote(bottomSheetGradeId, note, role, grade.status)
    })
  }

  function handleOpenEdit(gradeId: string) {
    setEditSheetGradeId(gradeId)
  }

  function handleCloseEdit() {
    setEditSheetGradeId(null)
  }

  async function handleSaveEdit(patch: GradePatch) {
    if (!editSheetGradeId || Object.keys(patch).length === 0) {
      setEditSheetGradeId(null)
      return
    }
    startTransition(async () => {
      addOptimistic({ type: 'patch', gradeId: editSheetGradeId, patch })
      setEditSheetGradeId(null)
      await updateGrade(editSheetGradeId, patch)
    })
  }

  async function handleSignOut() {
    await signOut()
    window.location.href = '/login'
  }

  // Filter logic
  const activeGrades = optimisticGrades.filter((g) => g.status !== 'done' && g.status !== 'wont_fix')
  const resolvedGrades = optimisticGrades.filter((g) => g.status === 'done' || g.status === 'wont_fix')

  const urgentCount = activeGrades.filter((g) => {
    const ds = getDeadlineStatus(g.deadline, g.status)
    return ds === 'urgent' || ds === 'soon'
  }).length

  let displayedGrades: GradeWithStatus[]
  if (activeFilter === 'done') {
    displayedGrades = resolvedGrades
  } else if (activeFilter === 'deadline') {
    displayedGrades = activeGrades.filter((g) => {
      const ds = getDeadlineStatus(g.deadline, g.status)
      return ds === 'urgent' || ds === 'soon'
    })
  } else {
    displayedGrades = activeGrades
  }

  // Sort
  displayedGrades = [...displayedGrades].sort((a, b) => {
    if (sortBy === 'date') {
      const aDate = a.graded_at ?? a.created_at
      const bDate = b.graded_at ?? b.created_at
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    }
    const order: Record<string, number> = { urgent: 0, soon: 1, none: 2, done: 3, wont_fix: 4 }
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
  const editSheetGrade = optimisticGrades.find((g) => g.id === editSheetGradeId) ?? null
  const greetingName = role === 'parent' ? 'Marek' : 'Milene'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold leading-tight">Milene hinded</h1>
            <p className="text-xs text-gray-400 leading-tight">
              Tere, {greetingName}! · {activeGrades.length} avatud
              {urgentCount > 0 && ` · ${urgentCount} tähtaeg`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/parse')}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-lg font-light flex items-center justify-center active:bg-gray-200 hover:bg-gray-200 transition-colors"
              title="Lisa käsitsi"
              aria-label="Lisa käsitsi"
            >
              +
            </button>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center active:bg-blue-700"
              title="Logi välja"
              aria-label="Logi välja"
            >
              {userInitials}
            </button>
          </div>
        </div>
      </header>

      {/* Summary pills */}
      <SummaryPills
        grades={optimisticGrades}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Filter tabs + sort toggle */}
      <div className="max-w-lg mx-auto px-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex border-b border-gray-200">
            {(['all', 'deadline', 'done'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeFilter === f
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {f === 'all' ? 'Kõik' : f === 'deadline' ? 'Tähtaeg' : 'Tehtud'}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs shrink-0 mb-0.5">
            {(['deadline', 'date'] as SortType[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  sortBy === s ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                }`}
              >
                {s === 'deadline' ? 'Tähtaeg' : 'Kuupäev'}
              </button>
            ))}
          </div>
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
                  <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">
                    {subject}
                    <span className="ml-1.5 text-gray-400 font-normal">({subjectGrades.length})</span>
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
                        onEdit={() => handleOpenEdit(grade.id)}
                        onReopen={() => handleReopen(grade.id)}
                        onWontFix={() => handleWontFix(grade.id)}
                        onDelete={() => handleDelete(grade.id)}
                        isPending={isPending}
                        hideSubject={true}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {activeFilter === 'all' && resolvedGrades.length > 0 && (
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
                  Tehtud / vahele jäetud ({resolvedGrades.length})
                </button>

                {doneExpanded && (
                  <div className="space-y-2">
                    {resolvedGrades.map((grade) => (
                      <GradeCard
                        key={grade.id}
                        grade={grade}
                        isExpanded={expandedCardId === grade.id}
                        onToggle={() => handleToggle(grade.id)}
                        onMarkDone={() => handleMarkDone(grade.id)}
                        onAddNote={() => handleOpenNote(grade.id)}
                        onReopen={() => handleReopen(grade.id)}
                        onDelete={() => handleDelete(grade.id)}
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
            {resolvedGrades.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="text-gray-700 font-medium mb-1">Pole veel midagi tehtud</p>
                <p className="text-gray-400 text-sm">Märgi ülesanded tehtuks, kui need on lahendatud.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resolvedGrades.map((grade) => (
                  <GradeCard
                    key={grade.id}
                    grade={grade}
                    isExpanded={expandedCardId === grade.id}
                    onToggle={() => handleToggle(grade.id)}
                    onMarkDone={() => handleMarkDone(grade.id)}
                    onAddNote={() => handleOpenNote(grade.id)}
                    onReopen={() => handleReopen(grade.id)}
                    onDelete={() => handleDelete(grade.id)}
                    isPending={isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomSheet
        isOpen={!!bottomSheetGradeId}
        onClose={handleCloseNote}
        onSave={handleSaveNote}
        title={bottomSheetGrade ? `Märkus: ${bottomSheetGrade.subject}` : 'Lisa märkus'}
        isPending={isPending}
      />

      <EditSheet
        isOpen={!!editSheetGradeId}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        grade={editSheetGrade}
        isPending={isPending}
      />
    </div>
  )
}
