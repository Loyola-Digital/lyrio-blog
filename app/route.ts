import { matchLocale } from '@/lib/locales'
import { blogHref } from '@/lib/site'

export function GET(req: Request) {
  const locale = matchLocale(req.headers.get('accept-language'))
  return new Response(null, { status: 307, headers: { Location: blogHref(locale), Vary: 'Accept-Language' } })
}
