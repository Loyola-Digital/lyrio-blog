import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { extractSteps } from '@/lib/markdown'
import { slugify } from '@/lib/slug'
import type { PostType, VersionFields } from '@/lib/types'

type Article = { topic: string; type: PostType; source: VersionFields }
const articles: Article[] = JSON.parse(readFileSync('content/artigos.json', 'utf8'))

describe('artigos do blog', () => {
  it('têm um tema por artigo (é a chave do sync)', () => {
    expect(new Set(articles.map((a) => a.topic)).size).toBe(articles.length)
  })

  it('só linkam artigos que existem, com a barra no fim', () => {
    const slugs = new Set(articles.map((a) => a.source.slug))
    for (const { source: s } of articles) {
      for (const [, path] of s.bodyMd.matchAll(/\]\((\/[^)\s]*)\)/g)) {
        expect(path, s.slug).toMatch(/^\/pt-BR\/blog\/([^/#]+\/)?(#.*)?$/)
        const slug = path.split('/')[3]
        if (slug) expect(slugs.has(slug), `${s.slug} → ${path}`).toBe(true)
      }
    }
  })

  it('têm todos os campos no formato que o blog espera', () => {
    const slugs = new Set<string>()
    for (const { source: s, type } of articles) {
      const where = s.slug
      expect(s.title.length, where).toBeGreaterThan(10)
      expect(s.title.length, where).toBeLessThanOrEqual(80)
      expect(s.headline, where).toBeTruthy()
      expect(s.summary.length, where).toBeGreaterThan(80)
      expect(s.metaDescription.length, where).toBeLessThanOrEqual(160)
      expect(s.slug, where).toBe(slugify(s.slug))
      expect(s.slug, where).not.toBe('')
      expect(slugs.has(s.slug), where).toBe(false)
      slugs.add(s.slug)
      expect(s.faq.length, where).toBeGreaterThanOrEqual(3)
      expect(s.faq.length, where).toBeLessThanOrEqual(6)
      for (const f of s.faq) expect(f.q && f.a, where).toBeTruthy()
      expect(s.bodyMd, where).toMatch(/^## /m)
      expect(s.bodyMd, where).not.toMatch(/^# /m)
      if (type === 'tutorial') expect(extractSteps(s.bodyMd).length, where).toBeGreaterThanOrEqual(3)
    }
  })

  it('não prometem resultado nem citam o que não está confirmado', () => {
    const all = JSON.stringify(articles)
    expect(all).not.toMatch(/\bgarant(e|imos|ido)\b|100%|cura definitiva|Usuário Desktop/i) // "não há garantia" pode
  })
})
