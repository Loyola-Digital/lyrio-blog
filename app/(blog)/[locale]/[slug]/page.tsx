import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getSql } from '@/lib/db'
import { fmt, t } from '@/lib/i18n'
import { articleJsonLd, jsonLdString } from '@/lib/jsonld'
import { isLocale, SOURCE_LOCALE } from '@/lib/locales'
import { readingMinutes, renderMarkdown } from '@/lib/markdown'
import { getPublishedVersion, listPublished } from '@/lib/posts'
import { SITE_URL } from '@/lib/site'
import { normalizeSlugParam } from '@/lib/slug'
import { articleHref, Header, kickerFor, StoreBand } from '../../components'

export const revalidate = 3600 // rede de segurança; publicar e traduzir já revalidam na hora

export function generateStaticParams() {
  return [] // cada artigo é gerado na primeira visita e fica em cache até ser revalidado
}

type Props = { params: Promise<{ locale: string; slug: string }> }

const load = cache(async (locale: string, rawSlug: string) => {
  if (!isLocale(locale)) return null
  return getPublishedVersion(getSql(), locale, normalizeSlugParam(rawSlug))
})

const absolute = (locale: string, slug: string) => `${SITE_URL}${articleHref(locale as never, slug)}`

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, slug } = await props.params
  const data = await load(locale, slug)
  if (!data) return {}
  const { version: v, post, alternates } = data
  const source = alternates.find((a) => a.locale === SOURCE_LOCALE)
  const description = v.metaDescription || v.summary
  return {
    title: `${v.title} · Lyrio`,
    description,
    alternates: {
      canonical: absolute(v.locale, v.slug),
      languages: {
        ...Object.fromEntries(alternates.map((a) => [a.locale, absolute(a.locale, a.slug)])),
        ...(source ? { 'x-default': absolute(source.locale, source.slug) } : {}),
      },
    },
    openGraph: {
      type: 'article', title: v.title, description, siteName: 'Lyrio', locale: v.locale, url: absolute(v.locale, v.slug),
      publishedTime: post.publishedAt?.toISOString(), modifiedTime: v.updatedAt.toISOString(),
      ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
    },
  }
}

export default async function ArticlePage(props: Props) {
  const { locale, slug } = await props.params
  const data = await load(locale, slug)
  if (!data || !isLocale(locale)) notFound()
  const { post, version: v, alternates } = data
  const s = t(locale)
  const related = (await listPublished(getSql(), locale)).filter((p) => p.postId !== post.id).slice(0, 3)
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(v.updatedAt)
  const url = absolute(locale, v.slug)
  const jsonLd = articleJsonLd({ post, version: v, url, homeUrl: `${SITE_URL}/${locale}`, homeName: s.blog_name })

  return (
    <>
      <Header locale={locale} s={s} languages={alternates.map((a) => ({ locale: a.locale, href: articleHref(a.locale, a.slug) }))} />
      <div className="wrap">
        <section className={post.coverUrl ? 'hero' : 'hero solo'}>
          <div>
            <div className="kicker">
              {kickerFor(s, post.type)} <span>· {fmt(s.reading, { n: readingMinutes(v.summary, v.bodyMd) })}</span>
            </div>
            <h1>{v.title}</h1>
            {v.headline && <p className="stand">{v.headline}</p>}
            <div className="by">
              <div className="mark"><img src="/logo.webp" alt="" width={18} height={18} /></div>
              <div><b>{s.team}</b>{fmt(s.updated, { date })}</div>
            </div>
          </div>
          {post.coverUrl && (
            <figure className="shot"><img src={post.coverUrl} alt="" /></figure>
          )}
        </section>
      </div>

      <article className="article">
        <div className="col">
          {v.summary && <p className="lede"><span className="run">{s.in_short}</span>{v.summary}</p>}
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(v.bodyMd) }} />
          {v.faq.length > 0 && (
            <section className="faq">
              <h2>{s.faq_title}</h2>
              {v.faq.map((f, i) => (
                <details key={i} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </section>
          )}
        </div>
      </article>

      <StoreBand s={s} />

      {related.length > 0 && (
        <div className="wrap rel">
          <h2 className="head">{s.read_also}</h2>
          <div className="grid3">
            {related.map((p) => (
              <a key={p.postId} href={articleHref(locale, p.slug)}>
                <div className="kicker">{kickerFor(s, p.type)}</div>
                <h3>{p.title}</h3>
                <p>{p.summary || p.headline}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
    </>
  )
}
