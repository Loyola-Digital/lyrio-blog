import { logout } from './actions'
import { requireAdmin } from './guard'

export default async function AdminHome() {
  await requireAdmin()
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1>Artigos</h1>
        <form action={logout}><button className="btn ghost">Sair</button></form>
      </header>
    </main>
  )
}
