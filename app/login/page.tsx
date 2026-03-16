'use client'

import { useState } from 'react'
import { signIn } from './actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn(email)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-xl font-semibold mb-2">Vaata oma emaili</h1>
          <p className="text-gray-500 text-sm">
            Saatsime sulle sisselogimislingi aadressile{' '}
            <span className="font-medium text-gray-700">{email}</span>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Milene hinded</h1>
          <p className="text-gray-500 text-sm">Logi sisse oma emailiga</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            autoComplete="email"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {error && (
            <p className="text-red-500 text-sm px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-base disabled:opacity-50 active:bg-blue-700 transition-colors"
          >
            {loading ? 'Saatmine...' : 'Saada link'}
          </button>
        </form>
      </div>
    </div>
  )
}
