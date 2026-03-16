'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const APP_PASSWORD = process.env.APP_PASSWORD || 'Findus123'

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  if (password !== APP_PASSWORD) {
    return { error: 'Vale parool.' }
  }

  cookies().set('mh-auth', email, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  redirect('/dashboard')
}
