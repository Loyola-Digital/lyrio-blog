import {
  Montserrat, Newsreader, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Noto_Serif, Noto_Serif_Bengali, Noto_Serif_Devanagari,
  Noto_Serif_JP, Noto_Serif_SC, Noto_Serif_TC, Noto_Serif_Telugu,
} from 'next/font/google'
import { serifFamilyFor } from '@/lib/fonts-map'
import type { Locale } from '@/lib/locales'

const sans = Montserrat({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['500', '600', '700'], variable: '--sans', display: 'swap' })

// Só a Newsreader é pré-carregada; as outras escritas baixam a fonte quando a página daquele idioma pede.
const newsreader = Newsreader({ subsets: ['latin', 'latin-ext'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--serif', display: 'swap' })
const notoSerif = Noto_Serif({ subsets: ['cyrillic', 'greek'], style: ['normal', 'italic'], variable: '--serif', display: 'swap', preload: false })
const notoSC = Noto_Serif_SC({ weight: ['400', '500'], variable: '--serif', display: 'swap', preload: false })
const notoTC = Noto_Serif_TC({ weight: ['400', '500'], variable: '--serif', display: 'swap', preload: false })
const notoJP = Noto_Serif_JP({ weight: ['400', '500'], variable: '--serif', display: 'swap', preload: false })
const notoDeva = Noto_Serif_Devanagari({ subsets: ['devanagari'], variable: '--serif', display: 'swap', preload: false })
const notoBengali = Noto_Serif_Bengali({ subsets: ['bengali'], variable: '--serif', display: 'swap', preload: false })
const notoTelugu = Noto_Serif_Telugu({ subsets: ['telugu'], variable: '--serif', display: 'swap', preload: false })
const naskh = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--serif', display: 'swap', preload: false })
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ['arabic'], variable: '--serif', display: 'swap', preload: false })

const SERIF: Record<string, string> = {
  Newsreader: newsreader.variable,
  'Noto Serif': notoSerif.variable,
  'Noto Serif SC': notoSC.variable,
  'Noto Serif TC': notoTC.variable,
  'Noto Serif JP': notoJP.variable,
  'Noto Serif Devanagari': notoDeva.variable,
  'Noto Serif Bengali': notoBengali.variable,
  'Noto Serif Telugu': notoTelugu.variable,
  'Noto Naskh Arabic': naskh.variable,
  'Noto Nastaliq Urdu': nastaliq.variable,
}

export function fontClassFor(locale: Locale): string {
  return `${sans.variable} ${SERIF[serifFamilyFor(locale)]}`
}
