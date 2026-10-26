import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DEFAULT_TRANSLATOR_MODEL, listModels } from '@/lib/ai/openrouter'
import { getSql } from '@/lib/db'
import { getPostForEdit, missingLocales } from '@/lib/posts'
import { requireAdmin } from '../../guard'
import { Editor } from './Editor'

export const maxDuration = 300

export default async function EditPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ traduzir?: string }> }) {
  await requireAdmin()
  const { id } = await props.params
  const { traduzir } = await props.searchParams
  const sql = getSql()
  const data = id === 'novo' ? null : await getPostForEdit(sql, id)
  if (id !== 'novo' && !data) notFound()
  const published = data?.post.status === 'published'
  const [models, missing] = await Promise.all([listModels(), published ? missingLocales(sql, id) : Promise.resolve([])])

  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1>{data ? 'Editar artigo' : 'Novo artigo (manual)'}</h1>
        <nav><Link href="/admin">← Artigos</Link></nav>
      </header>
      <Editor
        key={data ? `${data.post.id}-${data.post.rev}-${data.post.status}` : 'novo'}
        id={data?.post.id ?? null}
        post={data?.post ?? null}
        source={data?.source ?? null}
        missing={missing}
        autoTranslate={traduzir === '1' && missing.length > 0}
        models={models}
        defaultTranslator={DEFAULT_TRANSLATOR_MODEL}
      />
    </main>
  )
}
