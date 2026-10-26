import type { Locale } from './locales'

export function pathsFor(versions: { locale: Locale; slug: string }[]): string[] {
  const paths = versions.flatMap((v) => [`/${v.locale}`, `/${v.locale}/${encodeURIComponent(v.slug)}`])
  return [...new Set([...paths, '/sitemap.xml', '/llms.txt'])]
}
