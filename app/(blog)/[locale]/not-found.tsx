'use client'

// Artigo inexistente dentro de um idioma válido: 404 com o cabeçalho do blog, no idioma da URL.
// (o not-found não recebe params; useParams lê o idioma no cliente)
import { useParams } from 'next/navigation'
import { t } from '@/lib/i18n'
import { isLocale, LOCALES, SOURCE_LOCALE } from '@/lib/locales'
import { Header } from '../components'

export default function NotFound() {
  const params = useParams<{ locale?: string }>()
  const locale = params.locale && isLocale(params.locale) ? params.locale : SOURCE_LOCALE
  const s = t(locale)
  return (
    <>
      <Header locale={locale} s={s} languages={LOCALES.map((l) => ({ locale: l, href: `/${l}` }))} />
      <main className="wrap notfound" id="conteudo">
        <div className="kicker">404</div>
        <h1>{s.not_found_title}</h1>
        <p className="stand">{s.not_found_text}</p>
        <a className="get" href={`/${locale}`}>{s.back_home}</a>
      </main>
    </>
  )
}
