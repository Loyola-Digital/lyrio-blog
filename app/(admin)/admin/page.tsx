import Link from 'next/link'
import { getSql } from '@/lib/db'
import { TARGET_LOCALES } from '@/lib/locales'
import { listAdminPosts } from '@/lib/posts'
import { logout } from './actions'
import { requireAdmin } from './guard'
import { TYPE_LABEL } from './labels'

const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export default async function AdminHome() {
  await requireAdmin()
  const posts = await listAdminPosts(getSql())
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1>Artigos</h1>
        <nav>
          <Link href="/admin/sobre">Sobre o Lyrio</Link>
          <Link className="btn" href="/admin/novo">+ Novo artigo</Link>
          <form action={logout}><button className="btn ghost">Sair</button></form>
        </nav>
      </header>

      {posts.length === 0 ? (
        <p className="hint">Nenhum artigo ainda. Comece em “+ Novo artigo”.</p>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Título</th><th>Tipo</th><th>Status</th><th>Idiomas</th><th>Atualizado</th></tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/artigos/${p.id}`}>{p.title}</Link></td>
                <td>{TYPE_LABEL[p.type]}</td>
                <td>{p.status === 'published' ? <span className="tag pub">Publicado</span> : <span className="tag">Rascunho</span>}</td>
                <td className="num">{p.status === 'published' ? `${p.translated}/${TARGET_LOCALES.length}` : '—'}</td>
                <td className="num">{date.format(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
