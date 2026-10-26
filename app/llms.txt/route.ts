import { getSql } from '@/lib/db'
import { buildLlmsTxt } from '@/lib/llms'
import { listAllPublishedVersions } from '@/lib/posts'
import { getAbout } from '@/lib/settings'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600 // publicar e salvar o "Sobre o Lyrio" revalidam na hora

export async function GET() {
  const sql = getSql()
  const [about, versions] = await Promise.all([getAbout(sql), listAllPublishedVersions(sql)])
  const items = (locale: string) =>
    versions
      .filter((v) => v.locale === locale)
      .map((v) => ({ title: v.title, url: `${SITE_URL}/${locale}/${encodeURIComponent(v.slug)}`, summary: v.summary }))
  const body = buildLlmsTxt(about, [
    { heading: 'Artigos (Português)', items: items('pt-BR') },
    { heading: 'Articles (English)', items: items('en') },
  ])
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
