import { readFileSync } from 'node:fs'
import postgres from 'postgres'

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
  await sql.unsafe(readFileSync('db/schema.sql', 'utf8'))
  await sql.end()
  console.log('schema aplicado')
}

main()
