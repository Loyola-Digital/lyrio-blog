import { ENGLISH_NAME, type Locale } from '../locales'
import type { VersionFields } from '../types'
import { chatJson } from './openrouter'
import { DraftSchema } from './schemas'
import { toVersionFields } from './write'

export const TRANSLATOR_SYSTEM = `You translate articles from the Lyrio blog (an app that helps people quit pornography) from Brazilian Portuguese into another language.
- Adapt, don't translate word by word: it must read as written by a native speaker, with the same warm, direct tone and the same quiet faith-based values.
- Translate the app's feature names directly into the target language (e.g. "Opção Nuclear" becomes "Nuclear Option" in English), always the same way.
- Keep the Markdown structure identical (headings, lists, bold, links, images). Never translate URLs.
- Do not add or remove information, promises or claims.
- slug: in the target language, lowercase, words joined by hyphens; for non-Latin scripts use the native script.
- meta_description: up to 155 characters.
Return the same fields as the source.`

export function translatorUser(source: VersionFields, locale: Locale): string {
  const json = {
    title: source.title, headline: source.headline, summary: source.summary, body_md: source.bodyMd,
    faq: source.faq, slug: source.slug, meta_description: source.metaDescription,
  }
  return `Target language: ${ENGLISH_NAME[locale]} (${locale})\n\nSource:\n${JSON.stringify(json, null, 2)}`
}

export async function translateVersion(source: VersionFields, locale: Locale, model: string): Promise<VersionFields> {
  const draft = await chatJson({
    model, system: TRANSLATOR_SYSTEM, user: translatorUser(source, locale), schema: DraftSchema, name: 'article',
  })
  return toVersionFields(draft)
}
