'use server'

import { createServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function signIn(email: string): Promise<{ ok?: boolean; error?: string }> {
  const allowedEmails = [
    process.env.ALLOWED_EMAIL_PARENT,
    process.env.ALLOWED_EMAIL_STUDENT,
  ].filter(Boolean)

  if (!allowedEmails.includes(email)) {
    return { error: 'See email ei ole lubatud.' }
  }

  const headersList = headers()
  const origin = headersList.get('origin') || headersList.get('host') || 'http://localhost:3000'
  const siteUrl = origin.startsWith('http') ? origin : `https://${origin}`

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { ok: true }
}
