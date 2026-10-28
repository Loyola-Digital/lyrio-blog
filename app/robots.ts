import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Robôs de busca e de IA liberados explicitamente (é o objetivo do blog). Conferir a lista de tempos em tempos.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot',
  'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot',
]

export default function robots(): MetadataRoute.Robots {
  const rule = { allow: '/', disallow: ['/admin', '/api'] }
  return {
    rules: [{ userAgent: '*', ...rule }, { userAgent: AI_BOTS, ...rule }],
    sitemap: `${SITE_URL}/blog-sitemap.xml`, // o Worker serve o /sitemap.xml daqui nesse endereço
  }
}
