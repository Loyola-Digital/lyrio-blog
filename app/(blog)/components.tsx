import type { UiStrings } from '@/lib/i18n/pt-BR'
import { NATIVE_NAME, type Locale } from '@/lib/locales'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site'
import type { PostType } from '@/lib/types'

export const kickerFor = (s: UiStrings, type: PostType) =>
  ({ artigo: s.kicker_artigo, faq: s.kicker_faq, tutorial: s.kicker_tutorial })[type]

export const articleHref = (locale: Locale, slug: string) => `/${locale}/${encodeURIComponent(slug)}`

export function Header(props: { locale: Locale; s: UiStrings; languages: { locale: Locale; href: string }[] }) {
  const { locale, s } = props
  return (
    <header className="top">
      <div className="wrap">
        <a className="brand" href={`/${locale}`}>
          <img src="/logo.webp" alt="" width={26} height={26} />
          Lyrio <small>{s.blog_name}</small>
        </a>
        <nav>
          <a href={`/${locale}#guias`}>{s.nav_tutorial}</a>
          <a href={`/${locale}#perguntas`}>{s.nav_faq}</a>
          <a href={`/${locale}#artigos`}>{s.nav_artigo}</a>
        </nav>
        <div className="hright">
          <details className="lang">
            <summary aria-label={s.language}>{NATIVE_NAME[locale]}</summary>
            <ul>
              {props.languages.map((l) => (
                <li key={l.locale}>
                  <a href={l.href} hrefLang={l.locale} lang={l.locale} aria-current={l.locale === locale ? 'true' : undefined}>
                    {NATIVE_NAME[l.locale]}
                  </a>
                </li>
              ))}
            </ul>
          </details>
          <a className="get" href="#app">{s.get_app}</a>
        </div>
      </div>
    </header>
  )
}

export function StoreBand({ s }: { s: UiStrings }) {
  return (
    <section className="band" id="app">
      <div className="wrap">
        <img className="m" src="/logo.webp" alt="" width={46} height={46} />
        <div>
          <h3>{s.band_title}</h3>
          <p>{s.band_text}</p>
        </div>
        <div className="stores">
          <a className="store" href={APP_STORE_URL} rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.8 2.1-1.2 2.9-2.4c.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-1-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" /></svg>
            <div><small>{s.appstore_small}</small><span>App Store</span></div>
          </a>
          <a className="store" href={PLAY_STORE_URL} rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.4.7-.4 1.2v18c0 .5.1.9.4 1.2L13.7 12 3.6 1.8zm11.1 11.2 2.6 2.6-11.4 6.5 8.8-9.1zm3.7-3.6 3 1.7c.9.5.9 1.3 0 1.8l-3 1.7-2.8-2.6 2.8-2.6zM5.9 1.9l11.4 6.5-2.6 2.6-8.8-9.1z" /></svg>
            <div><small>{s.play_small}</small><span>Google Play</span></div>
          </a>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span>© {new Date().getFullYear()} Lyrio</span>
        <a href="https://lyrioapp.com">lyrioapp.com</a>
      </div>
    </footer>
  )
}
