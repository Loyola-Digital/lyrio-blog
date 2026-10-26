import postgres from 'postgres'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- linhas do Postgres; cada consulta tipa o que lê
export type Row = Record<string, any>
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>

let client: Sql | undefined

export function getSql(): Sql {
  const url = process.env.DATABASE_URL
  // sem isto o postgres.js tenta localhost:5432 e o erro fica confuso
  if (!url) throw new Error('DATABASE_URL não configurada. Na Vercel: Storage → Neon (cria a variável) e faça redeploy.')
  // prepare: false — o pooler da Neon (pgbouncer) não aceita prepared statements.
  // idle_timeout/max_lifetime — na Vercel a instância fica viva entre requisições; não segurar conexões ociosas.
  client ??= postgres(url, { prepare: false, idle_timeout: 20, max_lifetime: 60 * 30 }) as unknown as Sql
  return client
}
