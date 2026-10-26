import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSql } from '@/lib/db'
import { t } from '@/lib/i18n'
import { homeJsonLd, jsonLdString } from '@/lib/jsonld'
import { isLocale, LOCALES, type Locale } from '@/lib/locales'
import { listPublished } from '@/lib/posts'
import { SITE_URL } from '@/lib/site'
import type { PostType } from '@/lib/types'
import { articleHref, Header, kickerFor, StoreBand } from '../components'

export const revalidate = 3600 // rede de segurança; publicar já revalida na hora

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params
  if (!isLocale(locale)) return {}
  const s = t(locale)
  return {
    title: s.home_title,
    description: s.home_description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}`])), 'x-default': `${SITE_URL}/` },
    },
    openGraph: { title: s.home_title, description: s.home_description, siteName: 'Lyrio', locale, type: 'website' },
  }
}

export default async function Home(props: Props) {
  const { locale } = await props.params
  if (!isLocale(locale)) notFound()
  const s = t(locale)
  const posts = await listPublished(getSql(), locale)
  const groups: [PostType, string, string][] = [
    ['tutorial', 'guias', s.nav_tutorial],
    ['faq', 'perguntas', s.nav_faq],
    ['artigo', 'artigos', s.nav_artigo],
  ]
  return (
    <>
      <Header locale={locale} s={s} languages={LOCALES.map((l: Locale) => ({ locale: l, href: `/${l}` }))} />
      <main className="wrap home" id="conteudo">
        <section className="home-head">
          <h1>{s.home_title}</h1>
          <p className="stand">{s.home_description}</p>
        </section>
        {posts.length === 0 && <p className="empty">{s.empty}</p>}
        {groups.map(([type, id, label]) => {
          const items = posts.filter((p) => p.type === type)
          if (!items.length) return null
          return (
            <section key={type} id={id} className="rel">
              <h2 className="head">{label}</h2>
              <div className="grid3">
                {items.map((p) => (
                  <a key={p.postId} href={articleHref(locale, p.slug)}>
                    <div className="kicker">{kickerFor(s, p.type)}</div>
                    <h3>{p.title}</h3>
                    <p>{p.summary || p.headline}</p>
                  </a>
                ))}
              </div>
            </section>
          )
        })}
      </main>
      <StoreBand s={s} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd({
        locale, url: `${SITE_URL}/${locale}`, name: s.home_title, description: s.home_description,
        items: posts.map((p) => ({ name: p.title, url: `${SITE_URL}${articleHref(locale, p.slug)}` })),
      })) }} />
    </>
  )
}
