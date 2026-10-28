import { verifySession } from './auth'

// Guarda central do admin e das APIs (o proxy chama isto antes de qualquer rota).
// As páginas e ações continuam checando por conta própria; isto só garante que uma rota nova não fique aberta.
export function gate(rawPathname: string, token: string | undefined, secret: string): 'next' | 'login' | 'unauthorized' {
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname // trailingSlash: true
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const isApi = pathname === '/api' || pathname.startsWith('/api/')
  if ((!isAdmin && !isApi) || pathname === '/admin/login') return 'next'
  if (verifySession(token, secret)) return 'next'
  return isApi ? 'unauthorized' : 'login'
}
