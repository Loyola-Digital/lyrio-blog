import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import type { Sql } from '@/lib/db'
import type { VersionFields } from '@/lib/types'

const schema = readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8')

export async function testSql(): Promise<Sql> {
  const pg = new PGlite()
  await pg.exec(schema)
  return async (strings, ...values) => {
    const text = strings.reduce((acc, s, i) => acc + '$' + i + s)
    const res = await pg.query<Record<string, any>>(text, values)
    return res.rows
  }
}

export const src = (o: Partial<VersionFields> = {}): VersionFields => ({
  slug: 'como-parar', title: 'Como parar', headline: '', summary: 's', bodyMd: 'b', faq: [], metaDescription: '', ...o,
})
