import { describe, expect, it } from 'vitest'
import { serifFamilyFor } from '@/lib/fonts-map'
import { fmt, t } from '@/lib/i18n'
import { ptBR } from '@/lib/i18n/pt-BR'
import ui from '@/lib/i18n/ui.json'
import { LOCALES, TARGET_LOCALES } from '@/lib/locales'

describe('textos da interface', () => {
  it('existem em todos os idiomas, com os mesmos marcadores', () => {
    for (const l of TARGET_LOCALES) {
      const strings = (ui as Record<string, Record<string, string>>)[l]
      expect(Object.keys(strings ?? {}).sort(), l).toEqual(Object.keys(ptBR).sort())
      expect(strings.reading, l).toContain('{n}')
      expect(strings.updated, l).toContain('{date}')
    }
  })

  it('formata e cai para o português', () => {
    expect(fmt('{n} min de leitura', { n: 6 })).toBe('6 min de leitura')
    expect(t('pt-BR').in_short).toBe('Em resumo')
    expect(t('de').in_short).not.toBe('Em resumo')
  })
})

describe('fontes', () => {
  it('tem uma serifa para cada escrita', () => {
    for (const l of LOCALES) expect(serifFamilyFor(l)).toBeTruthy()
    expect(serifFamilyFor('pt-BR')).toBe('Newsreader')
    expect(serifFamilyFor('ru')).toBe('Noto Serif')
    expect(serifFamilyFor('ar')).toBe('Noto Naskh Arabic')
    expect(serifFamilyFor('ur')).toBe('Noto Nastaliq Urdu')
    expect(serifFamilyFor('ja')).toBe('Noto Serif JP')
    expect(serifFamilyFor('hi')).toBe('Noto Serif Devanagari')
  })
})
