import { describe, expect, it } from 'vitest'
import { normalizeSlugParam, slugify } from '@/lib/slug'

describe('slugify', () => {
  it('tira acento de letra latina', () => {
    expect(slugify('Como parar de vez?')).toBe('como-parar-de-vez')
    expect(slugify('Ação & Reação: o Botão Socorro')).toBe('acao-reacao-o-botao-socorro')
    expect(slugify('  --Olá--  ')).toBe('ola')
  })

  it('preserva outras escritas', () => {
    expect(slugify('如何停止观看色情内容')).toBe('如何停止观看色情内容')
    expect(slugify('कैसे रोकें')).toBe('कैसे-रोकें')
    expect(slugify('Ядерный вариант')).toBe('ядерный-вариант')
    expect(slugify('كيف أتوقف')).toBe('كيف-أتوقف')
  })

  it('corta em 80 caracteres sem hífen no fim', () => {
    expect(Array.from(slugify('palavra '.repeat(40))).length).toBeLessThanOrEqual(80)
    expect(slugify('palavra '.repeat(40))).not.toMatch(/-$/)
  })
})

describe('normalizeSlugParam', () => {
  it('decodifica a URL e devolve o original se for inválida', () => {
    expect(normalizeSlugParam('%E5%A6%82%E4%BD%95')).toBe('如何')
    expect(normalizeSlugParam('%E0%A4')).toBe('%E0%A4')
  })
})

describe('slug sem termos explícitos', () => {
  // filtros de DNS de escolas e empresas bloqueiam URLs com esses trechos
  it('tira palavras com "porn" e "xxx" do slug', () => {
    expect(slugify('Como parar de ver pornografia')).toBe('como-parar-de-ver')
    expect(slugify('Bloquear sites pornográficos no Chrome')).toBe('bloquear-sites-no-chrome')
    expect(slugify('XXX Invaders')).toBe('invaders')
    expect(slugify('Pornografia')).toBe('')
  })
})
