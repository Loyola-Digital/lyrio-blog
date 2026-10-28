import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { jsonLdString, siteJsonLd } from '@/lib/jsonld'
import { t } from '@/lib/i18n'
import { dirFor, isLocale } from '@/lib/locales'
import { asset, SITE_URL } from '@/lib/site'
import { Footer } from '../components'
import { fontClassFor } from '../fonts'
import '../blog.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Lyrio',
  authors: [{ name: 'Lyrio', url: 'https://lyrioapp.com' }],
  creator: 'Lyrio',
  publisher: 'Lyrio',
  icons: { icon: asset('/icon.png') }, // fora do app/: no lyrioapp.com só o prefixo do blog chega aqui
}

// Nada é gerado no build (o build não precisa do banco): cada página nasce na primeira visita e fica em cache.
export function generateStaticParams() {
  return []
}

export default async function BlogLayout(props: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  if (!isLocale(locale)) notFound()
  return (
    <html lang={locale} dir={dirFor(locale)} className={fontClassFor(locale)}>
      <body>
        <a className="skip" href="#conteudo">{t(locale).skip}</a>
        {props.children}
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd()) }} />
      </body>
    </html>
  )
}
