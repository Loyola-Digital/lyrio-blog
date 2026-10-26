// Publica os artigos prontos de content/artigos-lancamento.json (em português). Pode rodar de novo: pula o que já existe.
// node --env-file=.env.vercel-production --import tsx scripts/publish-launch.ts
// As traduções saem depois, pelo botão "Traduzir tudo" no admin.
import { readFileSync } from 'node:fs'
import { getSql } from '@/lib/db'
import { publishArticles } from '@/lib/launch'

async function main() {
  const articles = JSON.parse(readFileSync('content/artigos-lancamento.json', 'utf8'))
  const { created, skipped } = await publishArticles(getSql(), articles)
  console.log(`${created} publicados, ${skipped} já existiam.`)
  process.exit(0)
}

main()
