import { describe, expect, it } from 'vitest'
import { getAbout, setAbout } from '@/lib/settings'
import { testSql } from './helpers/db'

describe('settings', () => {
  it('guarda o Sobre o Lyrio', async () => {
    const sql = await testSql()
    expect(await getAbout(sql)).toBe('')
    await setAbout(sql, 'x')
    await setAbout(sql, 'y')
    expect(await getAbout(sql)).toBe('y')
  })

})
