import postgres from 'postgres'
import { afterAll, describe, expect, it } from 'vitest'
import type { Sql } from '@/lib/db'
import { createPost, deletePost, getPostForEdit } from '@/lib/posts'
import { src } from './helpers/db'

// Roda contra um Postgres de verdade (postgres.js), que serializa parâmetros diferente do PGlite.
// Ex.: TEST_DATABASE_URL=postgres://postgres:dev@localhost:54329/postgres npm test
const url = process.env.TEST_DATABASE_URL
const client = url ? postgres(url, { prepare: false }) : null
const sql = client as unknown as Sql

describe.skipIf(!url)('postgres.js de verdade', () => {
  afterAll(() => client?.end())

  it('guarda faq como JSON, não como string', async () => {
    const id = await createPost(sql, { type: 'faq', source: src({ slug: `pg-${Date.now()}`, faq: [{ q: 'a', a: 'b' }] }) })
    expect((await getPostForEdit(sql, id))!.source.faq).toEqual([{ q: 'a', a: 'b' }])
    await deletePost(sql, id)
  })
})
