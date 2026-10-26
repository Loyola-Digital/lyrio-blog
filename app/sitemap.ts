import type { MetadataRoute } from 'next'
import { getSql } from '@/lib/db'
import { LOCALES } from '@/lib/locales'
import { listAllPublishedVersions } from '@/lib/posts'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

const url = (locale: string, slug?: string) => `${SITE_URL}/${locale}${slug ? `/${encodeURIComponent(slug)}` : ''}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const versions = await listAllPublishedVersions(getSql())
  const homeLanguages = Object.fromEntries(LOCALES.map((l) => [l, url(l)]))
  const byPost = Map.groupBy(versions, (v) => v.postId)

  return [
    ...LOCALES.map((l) => ({ url: url(l), alternates: { languages: homeLanguages } })),
    ...versions.map((v) => ({
      url: url(v.locale, v.slug),
      lastModified: v.updatedAt,
      alternates: { languages: Object.fromEntries(byPost.get(v.postId)!.map((a) => [a.locale, url(a.locale, a.slug)])) },
    })),
  ]
}
