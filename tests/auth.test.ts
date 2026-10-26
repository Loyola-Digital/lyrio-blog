import { describe, expect, it } from 'vitest'
import { checkPassword, signSession, verifySession } from '@/lib/auth'

describe('checkPassword', () => {
  it('senha não configurada não libera ninguém', () => {
    expect(checkPassword('', '')).toBe(false)
    expect(checkPassword('qualquer', '')).toBe(false)
  })

  it('compara com a senha configurada', () => {
    expect(checkPassword('abc', 'abc')).toBe(true)
    expect(checkPassword('abd', 'abc')).toBe(false)
  })
})

describe('sessão', () => {
  it('não assina sem segredo', () => {
    expect(() => signSession('')).toThrow()
  })

  it('aceita token válido e recusa expirado, adulterado ou de outro segredo', () => {
    const t = signSession('s', 0)
    expect(verifySession(t, 's', 1000)).toBe(true)
    expect(verifySession(t, 's', 31 * 86400_000)).toBe(false)
    expect(verifySession(t, 'outro', 1000)).toBe(false)
    expect(verifySession(t.replace(/^\d+/, '9999999999999'), 's', 1000)).toBe(false)
    expect(verifySession(undefined, 's')).toBe(false)
    expect(verifySession('lixo', 's')).toBe(false)
    expect(verifySession(t, '', 1000)).toBe(false)
  })
})
