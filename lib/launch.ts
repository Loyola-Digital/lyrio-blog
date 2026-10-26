import type { Sql } from './db'
import { createPost, publish } from './posts'
import type { PostType, VersionFields } from './types'

export type LaunchTopic = { topic: string; type: PostType }

export async function pendingTopics<T extends LaunchTopic>(sql: Sql, topics: T[]): Promise<T[]> {
  const rows = await sql`select topic from posts where topic is not null`
  const done = new Set(rows.map((r) => r.topic))
  return topics.filter((t) => !done.has(t.topic))
}

// Cria e publica artigos prontos (pt-BR). Rodar de novo não duplica: pula os temas que já existem.
export async function publishArticles(
  sql: Sql, articles: (LaunchTopic & { source: VersionFields })[],
): Promise<{ created: number; skipped: number }> {
  const todo = await pendingTopics(sql, articles)
  for (const a of todo) {
    const id = await createPost(sql, { type: a.type, topic: a.topic, source: a.source })
    await publish(sql, id)
  }
  return { created: todo.length, skipped: articles.length - todo.length }
}
