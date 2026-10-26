import { describe, expect, it } from 'vitest'
import { securityHeaders } from '@/lib/security-headers'

const forSource = (source: string) => {
  const rule = securityHeaders().find((r) => r.source === source)
  return Object.fromEntries((rule?.headers ?? []).map((h) => [h.key, h.value]))
}

describe('securityHeaders', () => {
  it('protege todas as páginas contra sniff de tipo e vazamento de referrer', () => {
    expect(forSource('/:path*')).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
  })

  it('o admin não pode ser aberto dentro de iframe (clickjacking) nem ficar em cache', () => {
    expect(forSource('/admin/:path*')).toMatchObject({
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
      'Cache-Control': 'no-store',
    })
  })
})
