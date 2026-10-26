import Link from 'next/link'
import { DEFAULT_WRITER_MODEL, listModels } from '@/lib/ai/openrouter'
import { getSql } from '@/lib/db'
import { getAbout } from '@/lib/settings'
import { requireAdmin } from '../guard'
import { GenerateForm } from './GenerateForm'

export const maxDuration = 300

export default async function NovoPage() {
  await requireAdmin()
  const [models, about] = await Promise.all([listModels(), getAbout(getSql())])
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1>Novo artigo</h1>
        <nav><Link href="/admin">← Artigos</Link></nav>
      </header>
      <div className="adm-split">
        <section className="adm-panel">
          <h2>Manual</h2>
          <p className="hint">Você escreve título, headline e texto. Bom para quando o texto já está pronto.</p>
          <p><Link className="btn ghost" href="/admin/artigos/novo">Escrever à mão</Link></p>
        </section>
        <section className="adm-panel">
          <h2>Com IA</h2>
          {about.trim() ? (
            <GenerateForm models={models} defaultModel={DEFAULT_WRITER_MODEL} />
          ) : (
            <p className="adm-error">
              Preencha <Link href="/admin/sobre">Sobre o Lyrio</Link> antes de gerar com IA. É de lá que a IA tira o que o app faz.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
