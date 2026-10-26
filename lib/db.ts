import postgres from 'postgres'

export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, any>[]>

let client: Sql | undefined

export function getSql(): Sql {
  // prepare: false — o pooler da Neon (pgbouncer) não aceita prepared statements
  client ??= postgres(process.env.DATABASE_URL!, { prepare: false }) as unknown as Sql
  return client
}
