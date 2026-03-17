'use client'

import { useEffect, useState } from 'react'
import { Grade } from '@/types'

type GradePatch = Partial<Pick<Grade, 'grade' | 'grade_type' | 'graded_at' | 'deadline' | 'description'>>

interface EditSheetProps {
  isOpen: boolean
  onClose: () => void
  onSave: (patch: GradePatch) => void
  grade: Grade | null
  isPending?: boolean
}

export default function EditSheet({
  isOpen,
  onClose,
  onSave,
  grade,
  isPending = false,
}: EditSheetProps) {
  const [gradeVal, setGradeVal] = useState('')
  const [gradeType, setGradeType] = useState('')
  const [gradedAt, setGradedAt] = useState('')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen && grade) {
      setGradeVal(grade.grade ?? '')
      setGradeType(grade.grade_type ?? '')
      setGradedAt(grade.graded_at ? grade.graded_at.slice(0, 10) : '')
      setDeadline(grade.deadline ? grade.deadline.slice(0, 10) : '')
      setDescription(grade.description ?? '')
    }
  }, [isOpen, grade])

  function handleSave() {
    const patch: GradePatch = {}
    if (gradeVal.trim() !== (grade?.grade ?? '')) patch.grade = gradeVal.trim()
    if (gradeType.trim() !== (grade?.grade_type ?? '')) patch.grade_type = gradeType.trim() || null
    if (gradedAt !== (grade?.graded_at?.slice(0, 10) ?? '')) patch.graded_at = gradedAt || null
    if (deadline !== (grade?.deadline?.slice(0, 10) ?? '')) patch.deadline = deadline || null
    if (description.trim() !== (grade?.description ?? '')) patch.description = description.trim() || null
    onSave(patch)
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const hasChanges =
    gradeVal.trim() !== (grade?.grade ?? '') ||
    gradeType.trim() !== (grade?.grade_type ?? '') ||
    gradedAt !== (grade?.graded_at?.slice(0, 10) ?? '') ||
    deadline !== (grade?.deadline?.slice(0, 10) ?? '') ||
    description.trim() !== (grade?.description ?? '')

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Muuda hinnet"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Muuda hinnet</h2>
            <button
              onClick={onClose}
              className="text-gray-400 p-1 rounded-lg active:bg-gray-100"
              aria-label="Sulge"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Hinne</label>
                <input
                  type="text"
                  value={gradeVal}
                  onChange={(e) => setGradeVal(e.target.value)}
                  placeholder="nt. 3, MA, 5/10"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tüüp</label>
                <input
                  type="text"
                  value={gradeType}
                  onChange={(e) => setGradeType(e.target.value)}
                  placeholder="nt. test, kodutöö"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Hinde kuupäev</label>
                <input
                  type="date"
                  value={gradedAt}
                  onChange={(e) => setGradedAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tähtaeg</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kirjeldus</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ülesande kirjeldus..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 pb-safe pb-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              Tühista
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isPending}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:bg-blue-700"
            >
              {isPending ? 'Salvestamine...' : 'Salvesta'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
