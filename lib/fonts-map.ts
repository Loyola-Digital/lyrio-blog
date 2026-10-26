import type { Locale } from './locales'

const BY_LOCALE: Partial<Record<Locale, string>> = {
  ru: 'Noto Serif', uk: 'Noto Serif', bg: 'Noto Serif', sr: 'Noto Serif', mk: 'Noto Serif', el: 'Noto Serif',
  'zh-Hans': 'Noto Serif SC', 'zh-Hant': 'Noto Serif TC', ja: 'Noto Serif JP',
  hi: 'Noto Serif Devanagari', mr: 'Noto Serif Devanagari', bn: 'Noto Serif Bengali', te: 'Noto Serif Telugu',
  ar: 'Noto Naskh Arabic', ur: 'Noto Nastaliq Urdu',
}

export function serifFamilyFor(locale: Locale): string {
  return BY_LOCALE[locale] ?? 'Newsreader'
}
