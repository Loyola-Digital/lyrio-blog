// Põe o blog (Vercel) dentro do lyrioapp.com. Vão para a Vercel: /{idioma}/blog/*, /blog-static/* (JS, CSS, imagens)
// e /blog-sitemap.xml. O resto segue para o site principal; no /robots.txt dele o Worker acrescenta o sitemap do blog,
// e o /llms.txt sai do blog enquanto o site principal não tiver um.
const BLOG_PATH = /^\/[A-Za-z]{2,3}(-[A-Za-z]{2,4})?\/blog(\/|$)/

const worker = {
  async fetch(req, env) {
    const url = new URL(req.url)
    const { pathname } = url
    if (BLOG_PATH.test(pathname) || pathname.startsWith('/blog-static/')) return toBlog(req, url, pathname, env.BLOG_ORIGIN)
    if (pathname === '/blog-sitemap.xml') return toBlog(req, url, '/sitemap.xml', env.BLOG_ORIGIN)

    const res = await fetch(req)
    if (pathname === '/llms.txt' && res.status === 404) return toBlog(req, url, '/llms.txt', env.BLOG_ORIGIN)
    if (pathname === '/robots.txt' && res.ok) {
      const text = await res.text()
      const line = `Sitemap: ${url.origin}/blog-sitemap.xml`
      const headers = new Headers(res.headers)
      headers.delete('Content-Length')
      return new Response(text.includes(line) ? text : `${text.trimEnd()}\n${line}\n`, { status: res.status, headers })
    }
    return res
  },
}

export default worker

async function toBlog(req, url, path, origin) {
  const res = await fetch(new Request(new URL(path + url.search, origin), req), { redirect: 'manual' })
  const location = res.headers.get('Location')
  if (!location) return res
  // redirecionamentos da Vercel (ex.: /pt-BR/blog → /pt-BR/blog/) voltam para o lyrioapp.com
  const headers = new Headers(res.headers)
  headers.set('Location', new URL(location, origin).href.replace(new URL(origin).origin, url.origin))
  return new Response(res.body, { status: res.status, headers })
}
