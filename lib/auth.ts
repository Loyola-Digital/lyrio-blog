import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'lyrio_admin'
export const SESSION_DAYS = 30

const digest = (s: string) => createHash('sha256').update(s).digest()
const mac = (secret: string, payload: string) => createHmac('sha256', secret).update(payload).digest('hex')

export function checkPassword(input: string, expected = process.env.ADMIN_PASSWORD ?? ''): boolean {
  if (!expected || !input) return false
  return timingSafeEqual(digest(input), digest(expected))
}

export function signSession(secret: string, now = Date.now()): string {
  if (!secret) throw new Error('SESSION_SECRET não configurado.')
  const exp = String(now + SESSION_DAYS * 86400_000)
  return `${exp}.${mac(secret, exp)}`
}

export function verifySession(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token || !secret) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) <= now) return false
  return timingSafeEqual(digest(sig), digest(mac(secret, exp)))
}
