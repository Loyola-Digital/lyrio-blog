export const LOCALES = [
  'pt-BR', 'en', 'es', 'zh-Hans', 'zh-Hant', 'hi', 'ar', 'fr', 'bn', 'ru', 'id', 'ur', 'de', 'ja',
  'mr', 'te', 'bg', 'hr', 'cs', 'da', 'nl', 'et', 'fi', 'el', 'hu', 'it', 'lv', 'lt', 'pl', 'ro',
  'sk', 'sl', 'sv', 'pt-PT', 'nb', 'is', 'uk', 'sr', 'mk', 'sq', 'tr', 'ca',
] as const

export type Locale = (typeof LOCALES)[number]

export const SOURCE_LOCALE = 'pt-BR' satisfies Locale
export const TARGET_LOCALES: Locale[] = LOCALES.filter((l) => l !== SOURCE_LOCALE)

const RTL = new Set<string>(['ar', 'ur'])

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x)
}

export function dirFor(l: Locale): 'rtl' | 'ltr' {
  return RTL.has(l) ? 'rtl' : 'ltr'
}

const BY_LOWER = new Map<string, Locale>(LOCALES.map((l) => [l.toLowerCase(), l]))
const ALIASES: Record<string, Locale> = {
  'zh-tw': 'zh-Hant', 'zh-hk': 'zh-Hant', 'zh-mo': 'zh-Hant',
  zh: 'zh-Hans', 'zh-cn': 'zh-Hans', 'zh-sg': 'zh-Hans',
  pt: 'pt-BR', no: 'nb', nn: 'nb',
}

export function matchLocale(acceptLanguage: string | null): Locale {
  const tags = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 }
    })
    .filter((t) => t.tag)
    .sort((a, b) => b.q - a.q)

  for (const { tag } of tags) {
    const parts = tag.split('-')
    for (let n = parts.length; n > 0; n--) {
      const candidate = parts.slice(0, n).join('-')
      const hit = BY_LOWER.get(candidate) ?? ALIASES[candidate]
      if (hit) return hit
    }
  }
  return SOURCE_LOCALE
}

export const ENGLISH_NAME: Record<Locale, string> = {
  'pt-BR': 'Portuguese (Brazil)', en: 'English', es: 'Spanish', 'zh-Hans': 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese', hi: 'Hindi', ar: 'Arabic', fr: 'French', bn: 'Bengali',
  ru: 'Russian', id: 'Indonesian', ur: 'Urdu', de: 'German', ja: 'Japanese', mr: 'Marathi',
  te: 'Telugu', bg: 'Bulgarian', hr: 'Croatian', cs: 'Czech', da: 'Danish', nl: 'Dutch',
  et: 'Estonian', fi: 'Finnish', el: 'Greek', hu: 'Hungarian', it: 'Italian', lv: 'Latvian',
  lt: 'Lithuanian', pl: 'Polish', ro: 'Romanian', sk: 'Slovak', sl: 'Slovenian', sv: 'Swedish',
  'pt-PT': 'Portuguese (Portugal)', nb: 'Norwegian Bokmål', is: 'Icelandic', uk: 'Ukrainian',
  sr: 'Serbian (Cyrillic script)', mk: 'Macedonian', sq: 'Albanian', tr: 'Turkish', ca: 'Catalan',
}

export const NATIVE_NAME: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)', en: 'English', es: 'Español', 'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文', hi: 'हिन्दी', ar: 'العربية', fr: 'Français', bn: 'বাংলা', ru: 'Русский',
  id: 'Bahasa Indonesia', ur: 'اردو', de: 'Deutsch', ja: '日本語', mr: 'मराठी', te: 'తెలుగు',
  bg: 'Български', hr: 'Hrvatski', cs: 'Čeština', da: 'Dansk', nl: 'Nederlands', et: 'Eesti',
  fi: 'Suomi', el: 'Ελληνικά', hu: 'Magyar', it: 'Italiano', lv: 'Latviešu', lt: 'Lietuvių',
  pl: 'Polski', ro: 'Română', sk: 'Slovenčina', sl: 'Slovenščina', sv: 'Svenska',
  'pt-PT': 'Português (Portugal)', nb: 'Norsk bokmål', is: 'Íslenska', uk: 'Українська',
  sr: 'Српски', mk: 'Македонски', sq: 'Shqip', tr: 'Türkçe', ca: 'Català',
}
