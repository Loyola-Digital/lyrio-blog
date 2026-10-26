import { NextResponse, type NextRequest } from 'next/server'
import { gate } from '@/lib/admin-gate'
import { SESSION_COOKIE } from '@/lib/auth'

export function proxy(req: NextRequest) {
  const result = gate(req.nextUrl.pathname, req.cookies.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET ?? '')
  if (result === 'login') return NextResponse.redirect(new URL('/admin/login', req.url))
  if (result === 'unauthorized') return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/api/:path*'] }
