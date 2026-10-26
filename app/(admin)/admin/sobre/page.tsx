import Link from 'next/link'
import { getSql } from '@/lib/db'
import { getAbout } from '@/lib/settings'
import { requireAdmin } from '../guard'
import { AboutForm } from './forms'

export default async function SobrePage() {
  await requireAdmin()
  const about = await getAbout(getSql())

  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1>Sobre o Lyrio</h1>
        <nav><Link href="/admin">← Artigos</Link></nav>
      </header>
      <section className="adm-panel">
        <h2>O que a IA sabe sobre o app</h2>
        <p className="hint">
          É a única fonte que a IA usa sobre o Lyrio ao escrever, e o resumo que vai no /llms.txt.
          Descreva só o que o app faz de verdade.
        </p>
        <AboutForm about={about} />
      </section>
    </main>
  )
}
