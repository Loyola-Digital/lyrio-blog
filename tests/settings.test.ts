import { describe, expect, it } from 'vitest'
import { getAbout, getGlossary, setAbout, setGlossary } from '@/lib/settings'
import { testSql } from './helpers/db'

describe('settings', () => {
  it('guarda o Sobre o Lyrio', async () => {
    const sql = await testSql()
    expect(await getAbout(sql)).toBe('')
    await setAbout(sql, 'x')
    await setAbout(sql, 'y')
    expect(await getAbout(sql)).toBe('y')
  })

  it('guarda o glossário por idioma, sem um sobrescrever o outro', async () => {
    const sql = await testSql()
    expect(await getGlossary(sql, 'de')).toBeNull()
    await setGlossary(sql, 'de', { 'Opção Nuclear': 'Nuklearoption' })
    await setGlossary(sql, 'ja', { Socorro: '救助' })
    expect(await getGlossary(sql, 'de')).toEqual({ 'Opção Nuclear': 'Nuklearoption' })
    expect(await getGlossary(sql, 'ja')).toEqual({ Socorro: '救助' })
    await setGlossary(sql, 'de', {})
    expect(await getGlossary(sql, 'de')).toBeNull() // vazio = gerar de novo na próxima tradução
  })
})
