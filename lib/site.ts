// O blog é servido em lyrioapp.com/{idioma}/blog/ por um Worker do Cloudflare (cloudflare/blog-proxy.js).
export const SITE_URL = (process.env.SITE_URL ?? 'https://lyrioapp.com').replace(/\/$/, '')
// O /_next e as imagens do lyrioapp.com são do site principal; os do blog vêm por este prefixo (next.config assetPrefix).
export const ASSET_PREFIX = '/blog-static'
export const asset = (path: string) => `${ASSET_PREFIX}${path}`
// Barra no fim, como o resto do lyrioapp.com (trailingSlash: true no next.config).
export const blogHref = (locale: string, slug?: string) => `/${locale}/blog/${slug ? `${encodeURIComponent(slug)}/` : ''}`
export const MAIN_SITE = 'https://lyrioapp.com'
export const APP_STORE_URL = 'https://apps.apple.com/app/lyrio/id6760236148'
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.rork.lyrio&referrer=utm_source%3Dblog'
