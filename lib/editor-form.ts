import { slugify } from './slug'
import type { FaqItem, PostType, VersionFields } from './types'

const TYPES: PostType[] = ['artigo', 'faq', 'tutorial']

type Parsed = { ok: true; value: { type: PostType; coverUrl: string | null; source: VersionFields } } | { ok: false; error: string }

function parseFaq(raw: string): FaqItem[] {
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list
      .map((f) => ({ q: String(f?.q ?? '').trim(), a: String(f?.a ?? '').trim() }))
      .filter((f) => f.q && f.a)
  } catch {
    return []
  }
}

export function parseEditorForm(fd: FormData): Parsed {
  const get = (k: string) => String(fd.get(k) ?? '').trim()
  const type = get('type') as PostType
  const title = get('title')
  const bodyMd = get('bodyMd')
  if (!TYPES.includes(type)) return { ok: false, error: 'Tipo inválido.' }
  if (!title) return { ok: false, error: 'Preencha o título.' }
  if (!slugify(title)) return { ok: false, error: 'O título precisa ter letras ou números.' }
  if (!bodyMd) return { ok: false, error: 'Escreva o texto.' }
  return {
    ok: true,
    value: {
      type,
      coverUrl: get('coverUrl') || null,
      source: {
        title,
        headline: get('headline'),
        summary: get('summary'),
        slug: slugify(get('slug') || title),
        metaDescription: get('metaDescription'),
        bodyMd,
        faq: parseFaq(get('faq')),
      },
    },
  }
}
