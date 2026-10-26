// Gera o lote de lançamento como rascunhos (gasta crédito do OpenRouter). Pode rodar de novo: pula o que já existe.
// MODEL=anthropic/claude-opus-5.5 npm run launch:generate
import { readFileSync } from 'node:fs'
import { DEFAULT_WRITER_MODEL } from '@/lib/ai/openrouter'
import { writeArticle } from '@/lib/ai/write'
import { getSql } from '@/lib/db'
import { pendingTopics, type LaunchTopic } from '@/lib/launch'
import { createPost } from '@/lib/posts'
import { getAbout } from '@/lib/settings'

async function main() {
  const sql = getSql()
  const about = await getAbout(sql)
  if (!about.trim()) throw new Error('Preencha "Sobre o Lyrio" no admin (ou rode npm run seed:about) antes.')
  const model = process.env.MODEL ?? DEFAULT_WRITER_MODEL
  const all: LaunchTopic[] = JSON.parse(readFileSync('scripts/launch-topics.json', 'utf8'))
  const todo = await pendingTopics(sql, all)
  console.log(`${all.length - todo.length} já existem, ${todo.length} para gerar com ${model}`)

  const failed: string[] = []
  for (const [i, t] of todo.entries()) {
    try {
      const source = await writeArticle(t, about, model)
      await createPost(sql, { type: t.type, topic: t.topic, source })
      console.log(`[${i + 1}/${todo.length}] ok: ${source.title}`)
    } catch (e) {
      failed.push(t.topic)
      console.log(`[${i + 1}/${todo.length}] falhou: ${t.topic} — ${(e as Error).message}`)
    }
  }
  console.log(failed.length ? `Falharam ${failed.length}. Rode de novo para tentar só esses.` : 'Pronto. Revise os rascunhos no admin.')
  process.exit(0)
}

main()
