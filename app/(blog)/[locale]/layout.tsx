import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { jsonLdString, siteJsonLd } from '@/lib/jsonld'
import { dirFor, isLocale, LOCALES } from '@/lib/locales'
import { SITE_URL } from '@/lib/site'
import { Footer } from '../components'
import { fontClassFor } from '../fonts'
import '../blog.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Lyrio',
  authors: [{ name: 'Lyrio', url: 'https://lyrioapp.com' }],
  creator: 'Lyrio',
  publisher: 'Lyrio',
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default async function BlogLayout(props: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  if (!isLocale(locale)) notFound()
  return (
    <html lang={locale} dir={dirFor(locale)} className={fontClassFor(locale)}>
      <body>
        {props.children}
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd()) }} />
      </body>
    </html>
  )
}
