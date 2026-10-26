import type { Sql } from './db'
import type { PostType } from './types'

export type LaunchTopic = { topic: string; type: PostType }

export async function pendingTopics(sql: Sql, topics: LaunchTopic[]): Promise<LaunchTopic[]> {
  const rows = await sql`select topic from posts where topic is not null`
  const done = new Set(rows.map((r) => r.topic))
  return topics.filter((t) => !done.has(t.topic))
}
