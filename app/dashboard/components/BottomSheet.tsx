'use client'

import { useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: string) => void
  title?: string
  isPending?: boolean
}

export default function BottomSheet({
  isOpen,
  onClose,
  onSave,
  title = 'Lisa märkus',
  isPending = false,
}: BottomSheetProps) {
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setNote('')
      // Small delay so the sheet is visible before focusing
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 150)
    }
  }, [isOpen])

  function handleSave() {
    if (note.trim()) {
      onSave(note)
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <>
      {/* Dark overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{title}</h2>
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

          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Kirjuta märkus siia..."
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex gap-2 mt-3 pb-safe pb-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              Tühista
            </button>
            <button
              onClick={handleSave}
              disabled={!note.trim() || isPending}
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
