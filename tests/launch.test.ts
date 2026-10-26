import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { pendingTopics, type LaunchTopic } from '@/lib/launch'
import { createPost } from '@/lib/posts'
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
