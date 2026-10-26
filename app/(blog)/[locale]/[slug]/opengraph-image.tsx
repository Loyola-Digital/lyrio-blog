import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getSql } from '@/lib/db'
import { serifFamilyFor } from '@/lib/fonts-map'
import { dirFor, isLocale } from '@/lib/locales'
import { loadGoogleFont, ogFonts } from '@/lib/og-font'
import { getPublishedVersion } from '@/lib/posts'
import { normalizeSlugParam } from '@/lib/slug'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Lyrio'

const FOOTER = 'blog.lyrioapp.com'

export default async function Image(props: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await props.params
  const data = isLocale(locale) ? await getPublishedVersion(getSql(), locale, normalizeSlugParam(slug)) : null
  // O Satori não faz a junção das letras árabes (GSUB) e quebra; em ar/ur a imagem sai só com a marca.
  const rtl = isLocale(locale) && dirFor(locale) === 'rtl'
  const title = rtl ? '' : (data?.version.title ?? 'Lyrio')
  const family = isLocale(locale) && !rtl ? serifFamilyFor(locale) : 'Newsreader'
  const [font, logo] = await Promise.all([
    loadGoogleFont(family, `${title}Lyrio${FOOTER}`).catch(() => null),
    readFile(join(process.cwd(), 'public/logo.png')),
  ])

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#1b2847', color: '#f4f2eb', padding: '72px 80px', fontFamily: 'Serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={`data:image/png;base64,${logo.toString('base64')}`} width={64} height={64} alt="" />
          <span style={{ fontSize: 34, color: '#b89346' }}>Lyrio</span>
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 70 ? 54 : 66, lineHeight: 1.12, letterSpacing: -1 }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#b89346' }}>{FOOTER}</div>
      </div>
    ),
    { ...size, fonts: ogFonts(font) },
  )
}
