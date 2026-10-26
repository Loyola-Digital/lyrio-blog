// Regenera lib/i18n/ui.json traduzindo lib/i18n/pt-BR.ts para os 41 idiomas (gasta crédito do OpenRouter).
// MODEL=anthropic/claude-sonnet-5.5 npm run ui:translate
import { writeFileSync } from 'node:fs'
import { z } from 'zod'
import { chatJson, DEFAULT_TRANSLATOR_MODEL } from '@/lib/ai/openrouter'
import { ptBR } from '@/lib/i18n/pt-BR'
import { ENGLISH_NAME, TARGET_LOCALES } from '@/lib/locales'

const Schema = z.strictObject(Object.fromEntries(Object.keys(ptBR).map((k) => [k, z.string()])) as Record<keyof typeof ptBR, z.ZodString>)

async function main() {
  const model = process.env.MODEL ?? DEFAULT_TRANSLATOR_MODEL
  const out: Record<string, unknown> = {}
  for (const locale of TARGET_LOCALES) {
    out[locale] = await chatJson({
      model,
      system: 'You localize the interface of a blog about quitting pornography (the Lyrio app). Keep {n} and {date} placeholders exactly. Keep "Lyrio" untranslated. Short, natural UI text.',
      user: `Translate each value from Brazilian Portuguese into ${ENGLISH_NAME[locale]} (${locale}):\n${JSON.stringify(ptBR, null, 2)}`,
      schema: Schema,
      name: 'ui_strings',
    })
    console.log(locale)
  }
  writeFileSync('lib/i18n/ui.json', JSON.stringify(out, null, 2) + '\n')
}

main()
