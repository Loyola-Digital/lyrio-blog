// Teste real (gasta crédito do OpenRouter): escreve um tutorial e traduz para de, ja e ar.
// node --env-file=.env.local --import tsx scripts/ai-smoke.ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { DEFAULT_TRANSLATOR_MODEL, DEFAULT_WRITER_MODEL } from '@/lib/ai/openrouter'
import { makeGlossary, translateVersion } from '@/lib/ai/translate'
import { writeArticle } from '@/lib/ai/write'

const ABOUT = `O Lyrio é um app para iPhone e Android que ajuda a sair do vício em pornografia.
Funções: aba Emergência com o botão Socorro (frase de encorajamento, Dicas Rápidas e histórico) e a Opção Nuclear, que bloqueia todos os apps por 1, 2, 3, 4 ou 8 horas, sem volta. Diário privado. Controle de Apps com regras de bloqueio.`

async function main() {
  const pt = await writeArticle({ topic: 'como usar o botão Socorro numa crise de madrugada', type: 'tutorial' }, ABOUT, process.env.MODEL ?? DEFAULT_WRITER_MODEL)
  const out: Record<string, unknown> = { 'pt-BR': pt }
  for (const locale of ['de', 'ja', 'ar'] as const) {
    const model = process.env.TRANSLATOR ?? DEFAULT_TRANSLATOR_MODEL
    out[locale] = await translateVersion(pt, locale, await makeGlossary(locale, model), model)
  }
  mkdirSync('.superpowers', { recursive: true })
  writeFileSync('.superpowers/ai-smoke.json', JSON.stringify(out, null, 2))
  console.log('ok: .superpowers/ai-smoke.json')
}

main()
