'use client'

import { useState } from 'react'
import { GradeWithStatus } from '@/types'
import {
  getBorderClass,
  getDeadlineStatus,
  getGradeBadgeClass,
  formatDate,
  formatRelativeTime,
} from '@/lib/gradeUtils'

interface GradeCardProps {
  grade: GradeWithStatus
  isExpanded: boolean
  onToggle: () => void
  onMarkDone: () => void
  onAddNote: () => void
  onEdit?: () => void
  onReopen?: () => void
  onWontFix?: () => void
  onDelete?: () => void
  isPending?: boolean
  hideSubject?: boolean
}

export default function GradeCard({
  grade,
  isExpanded,
  onToggle,
  onMarkDone,
  onAddNote,
  onEdit,
  onReopen,
  onWontFix,
  onDelete,
  isPending = false,
  hideSubject = false,
}: GradeCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const deadlineStatus = getDeadlineStatus(grade.deadline, grade.status)
  const borderClass = getBorderClass(deadlineStatus)
  const badgeClass = getGradeBadgeClass(grade.grade, grade.status)
  const isDone = grade.status === 'done'
  const isWontFix = grade.status === 'wont_fix'
  const isResolved = isDone || isWontFix

  return (
    <div
      className={`bg-white rounded-xl border-l-4 ${borderClass} shadow-sm overflow-hidden transition-opacity ${
        isResolved ? 'opacity-60' : ''
      }`}
    >
      {/* Card header */}
      <button
        onClick={() => { onToggle(); setConfirmingDelete(false) }}
        className="w-full text-left px-4 py-3 min-h-[56px] flex items-start gap-3 active:bg-gray-50 hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {!hideSubject && (
              <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                {grade.subject}
              </span>
            )}

            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
              {isDone ? '✓' : isWontFix ? '—' : grade.grade}
            </span>

            {grade.grade_type && (
              <span className="text-[10px] text-gray-400">{grade.grade_type}</span>
            )}
          </div>

          {isExpanded ? (
            <p className="text-sm text-gray-700">{grade.description}</p>
          ) : (
            <div className="relative">
              <p className="text-sm text-gray-700 line-clamp-2">{grade.description}</p>
              {grade.description && grade.description.length > 80 && (
                <span className="text-xs text-gray-400 mt-0.5 block">Loe rohkem ›</span>
              )}
            </div>
          )}
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t border-gray-50">
          {/* Date row */}
          <div className="flex gap-4 mt-2.5 mb-3 text-xs text-gray-500">
            {grade.graded_at && (
              <span>
                <span className="text-gray-400">Hinne: </span>
                {formatDate(grade.graded_at)}
              </span>
            )}
            {grade.deadline && (
              <span
                className={
                  deadlineStatus === 'urgent'
                    ? 'text-red-600 font-semibold'
                    : deadlineStatus === 'soon'
                    ? 'text-amber-600 font-medium'
                    : ''
                }
              >
                <span className="text-gray-400">Tähtaeg: </span>
                {formatDate(grade.deadline)}
              </span>
            )}
          </div>

          {/* Note block */}
          {grade.note && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
              <p className="text-sm text-gray-600 italic">&ldquo;{grade.note}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">
                {grade.updated_by === 'parent' ? 'Vanem' : 'Milene'}
                {grade.status_created_at && ` · ${formatRelativeTime(grade.status_created_at)}`}
              </p>
            </div>
          )}

          {/* Resolved info */}
          {isResolved && grade.resolved_at && (
            <div className={`text-xs mb-3 ${isDone ? 'text-green-600' : 'text-gray-400'}`}>
              {isDone ? 'Tehtud' : 'Vahele jäetud'} {formatRelativeTime(grade.resolved_at)}
              {grade.updated_by && ` · ${grade.updated_by === 'parent' ? 'Vanem' : 'Milene'}`}
            </div>
          )}

          {/* Action bar — open grades */}
          {!isResolved && (
            <>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onMarkDone}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold active:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <span>✓</span>
                  <span>Märgi tehtud</span>
                </button>
                <button
                  onClick={onAddNote}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium active:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <span>💬</span>
                  <span>Lisa märkus</span>
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-medium border border-gray-200 active:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <span>✏️</span>
                    <span>Muuda</span>
                  </button>
                )}
                {onWontFix && (
                  <button
                    onClick={onWontFix}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-500 rounded-xl text-sm font-medium border border-gray-200 active:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <span>—</span>
                    <span>Jätan vahele</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Action bar — resolved grades */}
          {isResolved && onReopen && (
            <div className="pt-1">
              <button
                onClick={onReopen}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium active:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <span>↩</span>
                <span>Ava uuesti</span>
              </button>
            </div>
          )}

          {/* Delete */}
          {onDelete && (
            <div className="pt-2">
              {confirmingDelete ? (
                <button
                  onClick={onDelete}
                  disabled={isPending}
                  className="w-full py-2 bg-red-600 text-white rounded-xl text-sm font-semibold active:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Kindel? Kustuta
                </button>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  disabled={isPending}
                  className="w-full py-2 bg-red-50 text-red-500 rounded-xl text-sm font-medium active:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  Kustuta
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
