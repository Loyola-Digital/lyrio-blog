import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../cloudflare/blog-proxy.js'

const env = { BLOG_ORIGIN: 'https://lyrio-blog.vercel.app' }
const seen: string[] = []

function stub(responses: Record<string, () => Response>) {
  vi.stubGlobal('fetch', async (req: Request) => {
    seen.push(req.url)
    return (responses[req.url] ?? (() => new Response('principal')))()
  })
}

afterEach(() => {
  seen.length = 0
  vi.unstubAllGlobals()
})

describe('blog-proxy', () => {
  it('manda o blog e os assets para a Vercel e o resto para o site principal', async () => {
    stub({})
    await worker.fetch(new Request('https://lyrioapp.com/pt-BR/blog/x/?a=1'), env)
    await worker.fetch(new Request('https://lyrioapp.com/zh-Hans/blog'), env)
    await worker.fetch(new Request('https://lyrioapp.com/blog-static/_next/static/a.js'), env)
    await worker.fetch(new Request('https://lyrioapp.com/blog-sitemap.xml'), env)
    await worker.fetch(new Request('https://lyrioapp.com/pt-BR/blogueiro'), env)
    expect(seen).toEqual([
      'https://lyrio-blog.vercel.app/pt-BR/blog/x/?a=1',
      'https://lyrio-blog.vercel.app/zh-Hans/blog',
      'https://lyrio-blog.vercel.app/blog-static/_next/static/a.js',
      'https://lyrio-blog.vercel.app/sitemap.xml',
      'https://lyrioapp.com/pt-BR/blogueiro',
    ])
  })

  it('traz os redirecionamentos da Vercel de volta para o lyrioapp.com', async () => {
    stub({
      'https://lyrio-blog.vercel.app/pt-BR/blog': () => new Response(null, { status: 308, headers: { Location: '/pt-BR/blog/' } }),
      'https://lyrio-blog.vercel.app/en/blog/': () =>
        new Response(null, { status: 307, headers: { Location: 'https://lyrio-blog.vercel.app/en/blog/y/' } }),
    })
    const a = await worker.fetch(new Request('https://lyrioapp.com/pt-BR/blog'), env)
    const b = await worker.fetch(new Request('https://lyrioapp.com/en/blog/'), env)
    expect([a.status, a.headers.get('Location')]).toEqual([308, 'https://lyrioapp.com/pt-BR/blog/'])
    expect([b.status, b.headers.get('Location')]).toEqual([307, 'https://lyrioapp.com/en/blog/y/'])
  })

  it('acrescenta o sitemap do blog no robots.txt e usa o llms.txt do blog só se o principal não tiver', async () => {
    stub({
      'https://lyrioapp.com/robots.txt': () => new Response('User-agent: *\nAllow: /\n'),
      'https://lyrioapp.com/llms.txt': () => new Response('não', { status: 404 }),
      'https://lyrio-blog.vercel.app/llms.txt': () => new Response('# Lyrio'),
    })
    const robots = await (await worker.fetch(new Request('https://lyrioapp.com/robots.txt'), env)).text()
    expect(robots).toBe('User-agent: *\nAllow: /\nSitemap: https://lyrioapp.com/blog-sitemap.xml\n')
    expect(await (await worker.fetch(new Request('https://lyrioapp.com/llms.txt'), env)).text()).toBe('# Lyrio')
  })
})
