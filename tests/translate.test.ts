import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Sql } from '@/lib/db'
import { runPool } from '@/lib/pool'
import { createPost, missingLocales, publish } from '@/lib/posts'
import { getGlossary } from '@/lib/settings'
import { translateOne } from '@/lib/translate-one'
import { src, testSql } from './helpers/db'

describe('runPool', () => {
  it('nunca passa do limite em paralelo e não para nas falhas', async () => {
    let live = 0
    let peak = 0
    const r = await runPool([1, 2, 3, 4, 5, 6], 2, async (n) => {
      live++
      peak = Math.max(peak, live)
      await new Promise((res) => setTimeout(res, 5))
      live--
      if (n === 3) throw new Error('x')
    })
    expect(peak).toBe(2)
    expect(r).toEqual({ failed: [3] })
  })

  it('aceita lista vazia', async () => {
    expect(await runPool([], 4, async () => {})).toEqual({ failed: [] })
  })
})

describe('translateOne', () => {
  let sql: Sql
  let draftId: string
  let pubId: string
  const fakeDeps = () => ({
    translate: vi.fn(async (s: any, l: string) => ({ ...s, slug: `${l}-slug`, title: `${l} title` })),
    makeGlossary: vi.fn(async () => ({ Socorro: 'Hilfe' })),
  })

  beforeEach(async () => {
    sql = await testSql()
    draftId = await createPost(sql, { type: 'artigo', source: src({ slug: 'rascunho' }) })
    pubId = await createPost(sql, { type: 'artigo', source: src() })
    await publish(sql, pubId)
  })

  it('recusa rascunho, idioma de origem e artigo inexistente', async () => {
    const deps = fakeDeps()
    await expect(translateOne(sql, draftId, 'de', 'm/x', deps)).rejects.toMatchObject({ status: 409 })
    await expect(translateOne(sql, pubId, 'pt-BR', 'm/x', deps)).rejects.toMatchObject({ status: 400 })
    await expect(translateOne(sql, crypto.randomUUID(), 'de', 'm/x', deps)).rejects.toMatchObject({ status: 404 })
    expect(deps.translate).not.toHaveBeenCalled()
  })

  it('traduz, grava no rev atual e gera o glossário só uma vez', async () => {
    const deps = fakeDeps()
    const out = await translateOne(sql, pubId, 'de', 'm/x', deps)
    expect(out.slug).toBe('de-slug')
    expect(out.paths).toContain('/de')
    expect(await missingLocales(sql, pubId)).not.toContain('de')
    expect(deps.makeGlossary).toHaveBeenCalledTimes(1)
    expect(deps.makeGlossary).toHaveBeenCalledWith('de', 'm/x')
    expect(await getGlossary(sql, 'de')).toEqual({ Socorro: 'Hilfe' })
    await translateOne(sql, pubId, 'de', 'm/x', deps)
    expect(deps.makeGlossary).toHaveBeenCalledTimes(1)
    expect(deps.translate).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Como parar' }), 'de', { Socorro: 'Hilfe' }, 'm/x')
  })
})
