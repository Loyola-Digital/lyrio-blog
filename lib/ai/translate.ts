import { ENGLISH_NAME, type Locale } from '../locales'
import type { VersionFields } from '../types'
import { chatJson } from './openrouter'
import { DraftSchema, GlossarySchema } from './schemas'
import { toVersionFields } from './write'

export const TRANSLATOR_SYSTEM = `You translate articles from the Lyrio blog (an app that helps people quit pornography) from Brazilian Portuguese into another language.
- Adapt, don't translate word by word: it must read as written by a native speaker, with the same warm, direct tone and the same quiet faith-based values.
- Use exactly the glossary names for the app's features.
- Keep the Markdown structure identical (headings, lists, bold, links, images). Never translate URLs.
- Do not add or remove information, promises or claims.
- slug: in the target language, lowercase, words joined by hyphens; for non-Latin scripts use the native script.
- meta_description: up to 155 characters.
Return the same fields as the source.`

export const FEATURE_TERMS = [
  'Socorro', 'Emergência', 'Dicas Rápidas', 'Opção Nuclear', 'Arsenal', 'Hábitos', 'Jornada', 'Jogos', 'Diário',
  'Controle de Apps', 'Modo Foco', 'Comunidade', 'Sequência', 'Melhor sequência', 'Níveis', 'Conquistas',
  'Fase de recuperação', 'Persistência', 'Escudeiro', 'Patrulheiro', 'Veterano', 'Cavaleiro', 'Guerreiro(a)',
  'Primeiros Passos', 'Dia perfeito', 'Elite da Comunidade', 'Contribuições Especiais', 'PornEscape', 'Snake Streak',
  'Combine Virtudes', 'Bubble Streak', 'Memória dos Hábitos', 'Paciência',
]

export function translatorUser(source: VersionFields, locale: Locale, glossary: Record<string, string>): string {
  const terms = Object.entries(glossary).map(([pt, tr]) => `${pt} → ${tr}`).join('\n')
  const json = {
    title: source.title, headline: source.headline, summary: source.summary, body_md: source.bodyMd,
    faq: source.faq, slug: source.slug, meta_description: source.metaDescription,
  }
  return `Target language: ${ENGLISH_NAME[locale]} (${locale})\n\nGlossary:\n${terms}\n\nSource:\n${JSON.stringify(json, null, 2)}`
}

export async function translateVersion(
  source: VersionFields, locale: Locale, glossary: Record<string, string>, model: string,
): Promise<VersionFields> {
  const draft = await chatJson({
    model, system: TRANSLATOR_SYSTEM, user: translatorUser(source, locale, glossary), schema: DraftSchema, name: 'article',
  })
  return toVersionFields(draft)
}

export async function makeGlossary(locale: Locale, model: string): Promise<Record<string, string>> {
  const { terms } = await chatJson({
    model,
    system: 'You localize mobile app UI terms.',
    user: `Translate these feature names of the Lyrio app (an app to quit pornography) from Brazilian Portuguese into ${ENGLISH_NAME[locale]} (${locale}), as they would appear in a localized app interface. Keep game proper names (PornEscape, Snake Streak, Bubble Streak) unchanged. Return one entry per term, with "source" exactly as given.\n\n${FEATURE_TERMS.join('\n')}`,
    schema: GlossarySchema,
    name: 'glossary',
  })
  return Object.fromEntries(terms.filter((t) => t.source && t.target).map((t) => [t.source, t.target]))
}

export function parseGlossaryText(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const i = line.indexOf('=')
    if (i < 0) continue
    const [k, v] = [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    if (k && v) out[k] = v
  }
  return out
}

export function formatGlossaryText(m: Record<string, string>): string {
  return Object.entries(m).map(([k, v]) => `${k} = ${v}`).join('\n')
}
