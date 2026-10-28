// Deixa o blog igual a content/artigos.json (em português): cria, atualiza e apaga os temas de REMOVED.
// Pode rodar de novo: o que já está igual fica como está.
// node --env-file=.env.vercel-production --import tsx scripts/sync-articles.ts
// As traduções saem depois, pelo botão "Traduzir tudo" no admin.
import { readFileSync } from 'node:fs'
import { getSql } from '@/lib/db'
import { syncArticles } from '@/lib/launch'

// Temas que saíram do blog (substituídos pelas pautas da especialista em SEO, out/2026)
const REMOVED = [
  'Como bloquear sites pornográficos no celular',
  'Pornografia é vício? Como saber se eu tenho um problema',
  'O que é o desafio No Fap September?',
]

async function main() {
  const articles = JSON.parse(readFileSync('content/artigos.json', 'utf8'))
  const r = await syncArticles(getSql(), articles, REMOVED)
  console.log(`${r.created} criados, ${r.updated} atualizados, ${r.removed} removidos.`)
  process.exit(0)
}

main()
