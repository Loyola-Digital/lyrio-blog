'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkPassword, SESSION_COOKIE, SESSION_DAYS, signSession } from '@/lib/auth'

export async function login(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  if (!checkPassword(String(fd.get('password') ?? ''))) {
    await new Promise((r) => setTimeout(r, 800))
    return { error: 'Senha incorreta.' }
  }
  const secret = process.env.SESSION_SECRET ?? ''
  if (!secret) return { error: 'O admin não está configurado (falta SESSION_SECRET).' }
  ;(await cookies()).set(SESSION_COOKIE, signSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
  redirect('/admin')
}

export async function logout(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}
