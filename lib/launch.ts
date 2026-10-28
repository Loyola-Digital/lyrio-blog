import type { Sql } from './db'
import { createPost, deletePost, getPostForEdit, publish, updateSource } from './posts'
import type { PostType, VersionFields } from './types'

export type LaunchTopic = { topic: string; type: PostType }

export async function pendingTopics<T extends LaunchTopic>(sql: Sql, topics: T[]): Promise<T[]> {
  const rows = await sql`select topic from posts where topic is not null`
  const done = new Set(rows.map((r) => r.topic))
  return topics.filter((t) => !done.has(t.topic))
}

// o jsonb devolve as chaves de cada pergunta em outra ordem ({a, q}); compara só o conteúdo
const faqKey = (v: VersionFields) => JSON.stringify(v.faq.map((f) => [f.q, f.a]))
const same = (a: VersionFields, b: VersionFields) =>
  a.slug === b.slug && a.title === b.title && a.headline === b.headline && a.summary === b.summary &&
  a.bodyMd === b.bodyMd && a.metaDescription === b.metaDescription && faqKey(a) === faqKey(b)

// Deixa o blog igual à lista (pt-BR), casando pelo tema: apaga os removidos, atualiza o que mudou e cria o que falta.
// Rodar de novo não muda nada. Artigo atualizado volta a pedir tradução.
export async function syncArticles(
  sql: Sql, articles: (LaunchTopic & { source: VersionFields })[], remove: string[] = [],
): Promise<{ created: number; updated: number; removed: number }> {
  const rows = await sql`select id, topic from posts where topic is not null`
  const byTopic = new Map(rows.map((r) => [r.topic as string, r.id as string]))
  let created = 0, updated = 0, removed = 0
  for (const topic of remove) {
    const id = byTopic.get(topic)
    if (!id) continue
    await deletePost(sql, id)
    removed++
  }
  for (const a of articles) {
    const id = byTopic.get(a.topic)
    const cur = id ? await getPostForEdit(sql, id) : null
    if (!id || !cur) {
      await publish(sql, await createPost(sql, { type: a.type, topic: a.topic, source: a.source }))
      created++
    } else if (cur.post.type !== a.type || cur.post.status !== 'published' || !same(cur.source, a.source)) {
      await updateSource(sql, id, { type: a.type, coverUrl: cur.post.coverUrl, source: a.source })
      await publish(sql, id)
      updated++
    }
  }
  return { created, updated, removed }
}
