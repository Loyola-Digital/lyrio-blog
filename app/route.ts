import { matchLocale } from '@/lib/locales'

export function GET(req: Request) {
  const locale = matchLocale(req.headers.get('accept-language'))
  return new Response(null, { status: 307, headers: { Location: `/${locale}`, Vary: 'Accept-Language' } })
}
