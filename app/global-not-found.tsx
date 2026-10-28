// Endereço que não casa com nenhuma rota (ex.: idioma inexistente). Não passa por layout, então traz o próprio CSS.
// <a> e não <Link>: no lyrioapp.com o blog é uma zona à parte do site principal.
import type { Metadata } from 'next'
import { asset, blogHref } from '@/lib/site'
import './(blog)/blog.css'

export const metadata: Metadata = { title: 'Página não encontrada · Lyrio', robots: { index: false }, icons: { icon: asset('/icon.png') } }

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body>
        <main className="wrap notfound">
          <a className="brand" href={blogHref('pt-BR')}>
            <img src={asset('/logo.webp')} alt="" width={26} height={26} />
            Lyrio
          </a>
          <div className="kicker">404</div>
          <h1>Página não encontrada</h1>
          <p className="stand">Este endereço não existe ou o artigo saiu do ar.</p>
          <p className="stand" lang="en">Page not found. This address does not exist or the article was taken down.</p>
          <a className="get" href={blogHref('pt-BR')}>Ver todos os artigos</a> · <a className="get" href={blogHref('en')} lang="en">See all articles</a>
        </main>
      </body>
    </html>
  )
}
