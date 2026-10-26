import { describe, expect, it } from 'vitest'
import { dirFor, ENGLISH_NAME, LOCALES, matchLocale, NATIVE_NAME, TARGET_LOCALES } from '@/lib/locales'

describe('locales', () => {
  it('tem os 42 idiomas do site, 41 de destino', () => {
    expect(LOCALES).toHaveLength(42)
    expect(TARGET_LOCALES).toHaveLength(41)
    expect(TARGET_LOCALES).not.toContain('pt-BR')
  })

  it('marca árabe e urdu como RTL', () => {
    expect(dirFor('ar')).toBe('rtl')
    expect(dirFor('ur')).toBe('rtl')
    expect(dirFor('he' as any)).toBe('ltr')
  })

  it('escolhe o idioma pelo Accept-Language', () => {
    expect(matchLocale('pt-BR,pt;q=0.9')).toBe('pt-BR')
    expect(matchLocale('pt-PT')).toBe('pt-PT')
    expect(matchLocale('pt')).toBe('pt-BR')
    expect(matchLocale('zh-TW')).toBe('zh-Hant')
    expect(matchLocale('zh-HK')).toBe('zh-Hant')
    expect(matchLocale('zh-CN')).toBe('zh-Hans')
    expect(matchLocale('zh')).toBe('zh-Hans')
    expect(matchLocale('no')).toBe('nb')
    expect(matchLocale('nn')).toBe('nb')
    expect(matchLocale('en-US,en;q=0.8')).toBe('en')
    expect(matchLocale('de;q=0.5, fr;q=0.8')).toBe('fr')
    expect(matchLocale(null)).toBe('pt-BR')
    expect(matchLocale('xx-YY')).toBe('pt-BR')
  })

  it('tem nome em inglês e nativo para cada idioma', () => {
    for (const l of LOCALES) {
      expect(ENGLISH_NAME[l]).toBeTruthy()
      expect(NATIVE_NAME[l]).toBeTruthy()
    }
  })
})
