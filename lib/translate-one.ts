import type { makeGlossary, translateVersion } from './ai/translate'
import type { Sql } from './db'
import { SOURCE_LOCALE, type Locale } from './locales'
import { getPostForEdit, listVersionsOf, saveTranslation } from './posts'
import { pathsFor } from './revalidate'
import { getGlossary, setGlossary } from './settings'

export class TranslateError extends Error {
  constructor(message: string, public status: 400 | 404 | 409) {
    super(message)
  }
}

export async function translateOne(
  sql: Sql,
  postId: string,
  locale: Locale,
  model: string,
  deps: { translate: typeof translateVersion; makeGlossary: typeof makeGlossary },
): Promise<{ slug: string; paths: string[] }> {
  if (locale === SOURCE_LOCALE) throw new TranslateError('O português é o idioma de origem.', 400)
  const data = await getPostForEdit(sql, postId) // post e origem numa leitura só: o rev bate com o texto traduzido
  if (!data) throw new TranslateError('Artigo não encontrado.', 404)
  if (data.post.status !== 'published') throw new TranslateError('Só artigos publicados são traduzidos.', 409)

  let glossary = await getGlossary(sql, locale)
  if (!glossary) {
    glossary = await deps.makeGlossary(locale, model)
    await setGlossary(sql, locale, glossary)
  }
  const fields = await deps.translate(data.source, locale, glossary, model)
  const { slug } = await saveTranslation(sql, postId, locale, data.post.rev, fields)
  // todas as versões: o hreflang das outras páginas passa a incluir este idioma
  return { slug, paths: pathsFor(await listVersionsOf(sql, postId)) }
}
