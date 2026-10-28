import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Sql } from '@/lib/db'
import { pendingTopics, syncArticles, type LaunchTopic } from '@/lib/launch'
import { createPost, listPublished } from '@/lib/posts'
import { src, testSql } from './helpers/db'

const topics: LaunchTopic[] = JSON.parse(readFileSync('scripts/launch-topics.json', 'utf8'))

describe('lote de lançamento', () => {
  it('tem os 20 temas da spec: 10 guias, 7 perguntas, 3 artigos', () => {
    expect(topics).toHaveLength(20)
    expect(topics.filter((t) => t.type === 'tutorial')).toHaveLength(10)
    expect(topics.filter((t) => t.type === 'faq')).toHaveLength(7)
    expect(topics.filter((t) => t.type === 'artigo')).toHaveLength(3)
    expect(topics.some((t) => t.topic.includes('★'))).toBe(false)
  })

  it('pula temas que já viraram artigo', async () => {
    const sql = await testSql()
    await createPost(sql, { type: 'faq', topic: topics[10].topic, source: src() })
    const pending = await pendingTopics(sql, topics)
    expect(pending).toHaveLength(19)
    expect(pending.map((t) => t.topic)).not.toContain(topics[10].topic)
  })
})

describe('syncArticles', () => {
  const a = { topic: 'Tema A', type: 'faq' as const, source: src({ slug: 'tema-a', title: 'Tema A' }) }
  const b = { topic: 'Tema B', type: 'tutorial' as const, source: src({ slug: 'tema-b', title: 'Tema B' }) }
  const slugs = async (sql: Sql) => (await listPublished(sql, 'pt-BR')).map((p) => p.slug).sort()

  it('cria e publica os temas novos e não duplica ao rodar de novo', async () => {
    const sql = await testSql()
    expect(await syncArticles(sql, [a, b])).toEqual({ created: 2, updated: 0, removed: 0 })
    expect(await slugs(sql)).toEqual(['tema-a', 'tema-b'])
    expect(await syncArticles(sql, [a, b])).toEqual({ created: 0, updated: 0, removed: 0 })
  })

  it('atualiza o artigo do mesmo tema (inclusive o slug) e apaga os temas removidos', async () => {
    const sql = await testSql()
    await syncArticles(sql, [a, b])
    const a2 = { ...a, source: { ...a.source, slug: 'tema-a-novo', bodyMd: 'novo' } }
    expect(await syncArticles(sql, [a2], ['Tema B', 'Tema inexistente'])).toEqual({ created: 0, updated: 1, removed: 1 })
    expect(await slugs(sql)).toEqual(['tema-a-novo'])
  })

  it('apaga antes de criar: um tema novo pode usar o slug de um removido', async () => {
    const sql = await testSql()
    await syncArticles(sql, [a])
    const c = { ...a, topic: 'Tema C' }
    expect(await syncArticles(sql, [c], ['Tema A'])).toEqual({ created: 1, updated: 0, removed: 1 })
    expect(await slugs(sql)).toEqual(['tema-a'])
  })
})
