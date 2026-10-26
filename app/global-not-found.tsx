// Endereço que não casa com nenhuma rota (ex.: idioma inexistente). Não passa por layout, então traz o próprio CSS.
import type { Metadata } from 'next'
import Link from 'next/link'
import './(blog)/blog.css'

export const metadata: Metadata = { title: 'Página não encontrada · Lyrio', robots: { index: false } }

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body>
        <main className="wrap notfound">
          <Link className="brand" href="/pt-BR">
            <img src="/logo.webp" alt="" width={26} height={26} />
            Lyrio
          </Link>
          <div className="kicker">404</div>
          <h1>Página não encontrada</h1>
          <p className="stand">Este endereço não existe ou o artigo saiu do ar.</p>
          <p className="stand" lang="en">Page not found. This address does not exist or the article was taken down.</p>
          <Link className="get" href="/pt-BR">Ver todos os artigos</Link> · <Link className="get" href="/en" lang="en">See all articles</Link>
        </main>
      </body>
    </html>
  )
}
