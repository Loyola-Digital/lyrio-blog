import type { NextConfig } from 'next'
import { LOCALES } from './lib/locales'
import { securityHeaders } from './lib/security-headers'
import { ASSET_PREFIX } from './lib/site'

// Modelo clássico de cache (ISR + revalidatePath), sem cacheComponents.
const nextConfig: NextConfig = {
  // Zona do lyrioapp.com: o Worker do Cloudflare manda /{idioma}/blog/* e /blog-static/* para cá.
  assetPrefix: ASSET_PREFIX,
  trailingSlash: true, // igual ao site principal (/pt-BR/research/)
  experimental: { globalNotFound: true }, // 404 próprio para URLs fora de qualquer rota (há dois root layouts)
  async headers() {
    return securityHeaders()
  },
  async redirects() {
    // /pt-BR no domínio da Vercel (no lyrioapp.com essa é a home do site principal)
    return [{ source: `/:locale(${LOCALES.join('|')})`, destination: '/:locale/blog/', permanent: false }]
  },
}

export default nextConfig
