import type { Locale } from './locales'
import { blogHref } from './site'

export function pathsFor(versions: { locale: Locale; slug: string }[]): string[] {
  const paths = versions.flatMap((v) => [blogHref(v.locale), blogHref(v.locale, v.slug)])
  return [...new Set([...paths, '/sitemap.xml', '/llms.txt'])]
}
