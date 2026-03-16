'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseEmail, saveGrades } from './actions'
import { ParsedGrade } from '@/lib/parseEmail'

export default function ParsePage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedGrade[] | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleParse() {
    if (!text.trim()) return
    setIsParsing(true)
    setError('')
    setParsed(null)

    const result = await parseEmail(text.trim())
    setIsParsing(false)

    if (result.error) {
      setError(result.error)
      return
    }

    const grades = Array.isArray(result.result) ? result.result : [result.result!]
    setParsed(grades)
  }

  async function handleSave() {
    if (!parsed) return
    setIsSaving(true)
    setError('')

    const result = await saveGrades(parsed, text.trim())
    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSaved(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <p className="font-medium text-gray-700">Salvestatud!</p>
          <p className="text-sm text-gray-400 mt-1">Suunatakse tagasi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center active:bg-gray-200 text-lg"
            aria-label="Tagasi"
          >
            ←
          </button>
          <h1 className="text-base font-bold">Lisa käsitsi</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* Paste area */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1.5">
            Kleebi e-kooli emaili sisu siia
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setParsed(null)
              setSaved(false)
            }}
            placeholder="Kleebi kogu emaili tekst siia..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm px-1">{error}</p>}

        {/* Parse button */}
        {!parsed && (
          <button
            onClick={handleParse}
            disabled={isParsing || !text.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 active:bg-blue-700 transition-colors"
          >
            {isParsing ? 'Parsin...' : 'Parsi'}
          </button>
        )}

        {/* Parsed result preview */}
        {parsed && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">
              Leitud {parsed.length} hinne{parsed.length !== 1 ? 't' : ''}. Kontrolli ja salvesta:
            </p>

            {parsed.map((g, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{g.subject}</span>
                  <span className="text-sm font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{g.grade}</span>
                  {g.grade_type && <span className="text-xs text-gray-400">{g.grade_type}</span>}
                </div>
                {g.graded_at && (
                  <p className="text-xs text-gray-400">Kuupäev: {g.graded_at}</p>
                )}
                {g.deadline && (
                  <p className="text-xs text-amber-600 font-medium">Tähtaeg: {g.deadline}</p>
                )}
                {g.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{g.description}</p>
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 active:bg-green-700 transition-colors"
              >
                {isSaving ? 'Salvestamine...' : 'Salvesta'}
              </button>
              <button
                onClick={() => setParsed(null)}
                className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium text-base active:bg-gray-200 transition-colors"
              >
                Muuda
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
