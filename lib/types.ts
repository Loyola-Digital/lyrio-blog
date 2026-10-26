import type { Locale } from './locales'

export type PostType = 'artigo' | 'faq' | 'tutorial'
export type FaqItem = { q: string; a: string }
export type VersionFields = {
  slug: string
  title: string
  headline: string
  summary: string
  bodyMd: string
  faq: FaqItem[]
  metaDescription: string
}
export type Post = {
  id: string
  type: PostType
  topic: string | null
  coverUrl: string | null
  status: 'draft' | 'published'
  rev: number
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}
export type Version = VersionFields & { postId: string; locale: Locale; rev: number; updatedAt: Date }
