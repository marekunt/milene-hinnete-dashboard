'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl p-6 shadow-sm border">
        <h1 className="text-lg font-bold text-red-600 mb-2">Viga ({error.digest})</h1>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all bg-gray-50 rounded p-3">
          {error.message || 'No message'}
        </pre>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Proovi uuesti
        </button>
      </div>
    </div>
  )
}
