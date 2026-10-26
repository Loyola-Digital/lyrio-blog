import postgres from 'postgres'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- linhas do Postgres; cada consulta tipa o que lê
export type Row = Record<string, any>
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>

let client: Sql | undefined

export function getSql(): Sql {
  // prepare: false — o pooler da Neon (pgbouncer) não aceita prepared statements.
  // idle_timeout/max_lifetime — na Vercel a instância fica viva entre requisições; não segurar conexões ociosas.
  client ??= postgres(process.env.DATABASE_URL!, { prepare: false, idle_timeout: 20, max_lifetime: 60 * 30 }) as unknown as Sql
  return client
}
