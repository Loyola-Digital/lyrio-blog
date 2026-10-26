import { describe, expect, it } from 'vitest'
import { gate } from '@/lib/admin-gate'
import { signSession } from '@/lib/auth'

const ok = signSession('s')

describe('gate', () => {
  it('deixa o blog e o login passarem', () => {
    expect(gate('/pt-BR/algum-artigo', undefined, 's')).toBe('next')
    expect(gate('/admin/login', undefined, 's')).toBe('next')
  })

  it('manda para o login quem abre o admin sem sessão válida', () => {
    expect(gate('/admin', undefined, 's')).toBe('login')
    expect(gate('/admin/artigos/novo', 'lixo', 's')).toBe('login')
    expect(gate('/admin', ok, '')).toBe('login') // segredo não configurado não libera
    expect(gate('/admin/sobre', ok, 's')).toBe('next')
  })

  it('responde 401 nas APIs sem sessão', () => {
    expect(gate('/api/translate', undefined, 's')).toBe('unauthorized')
    expect(gate('/api/upload', 'lixo', 's')).toBe('unauthorized')
    expect(gate('/api/translate', ok, 's')).toBe('next')
  })

  it('não confunde caminhos parecidos', () => {
    expect(gate('/administracao', undefined, 's')).toBe('next')
    expect(gate('/admin/login/../artigos', undefined, 's')).toBe('login')
  })
})
