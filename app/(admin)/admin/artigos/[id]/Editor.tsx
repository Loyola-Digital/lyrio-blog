'use client'

import { upload } from '@vercel/blob/client'
import { useRef, useState } from 'react'
import type { ModelOption } from '@/lib/ai/openrouter'
import type { Locale } from '@/lib/locales'
import { renderMarkdown } from '@/lib/markdown'
import { blogHref } from '@/lib/site'
import { wrapSelection } from '@/lib/md-insert'
import type { FaqItem, Post, Version } from '@/lib/types'
import { deletePostAction, saveEditor, unpublishPost } from '../../actions'
import { useNoResetAction } from '../../useNoResetAction'
import { TranslationPanel } from './TranslationPanel'

export function Editor(props: {
  id: string | null
  post: Post | null
  source: Version | null
  missing: Locale[]
  autoTranslate: boolean
  models: ModelOption[]
  defaultTranslator: string
}) {
  const { id, post, source } = props
  const published = post?.status === 'published'
  const [state, onSubmit, pending] = useNoResetAction(saveEditor.bind(null, id), {})
  const [body, setBody] = useState(source?.bodyMd ?? '')
  const [faq, setFaq] = useState<FaqItem[]>(source?.faq ?? [])
  const [cover, setCover] = useState(post?.coverUrl ?? '')
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)

  function insert(before: string, after = '') {
    const el = bodyRef.current
    if (!el) return
    const r = wrapSelection(body, el.selectionStart, el.selectionEnd, before, after)
    setBody(r.value)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(r.cursor, r.cursor)
    })
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true)
    setUploadError('')
    try {
      const blob = await upload(`artigos/${file.name}`, file, { access: 'public', handleUploadUrl: '/api/upload/' })
      return blob.url
    } catch (e) {
      setUploadError(`Não deu para subir a imagem: ${(e as Error).message}`)
      return null
    } finally {
      setUploading(false)
    }
  }

  const setFaqItem = (i: number, patch: Partial<FaqItem>) => setFaq(faq.map((f, j) => (j === i ? { ...f, ...patch } : f)))

  return (
    <div className="ed">
      <form id="editor" className="ed-main" onSubmit={onSubmit}>
        {/* botão padrão desabilitado: Enter num campo não envia (num publicado, republicaria e retraduziria tudo) */}
        <button type="submit" disabled hidden aria-hidden="true" />
        <label htmlFor="type">Tipo</label>
        <select id="type" name="type" defaultValue={post?.type ?? 'artigo'}>
          <option value="artigo">Artigo</option>
          <option value="faq">Perguntas (FAQ)</option>
          <option value="tutorial">Guia prático (tutorial)</option>
        </select>

        <label htmlFor="title">Título</label>
        <input id="title" name="title" defaultValue={source?.title} required />

        <label htmlFor="headline">Headline</label>
        <input id="headline" name="headline" defaultValue={source?.headline} />

        <label htmlFor="summary">Em resumo</label>
        <textarea id="summary" name="summary" rows={3} defaultValue={source?.summary} />
        <p className="hint">2 a 3 frases que respondem sozinhas. É o trecho que as IAs costumam citar.</p>

        <label htmlFor="bodyMd">Texto</label>
        <div className="ed-bar">
          <div>
            <button type="button" onClick={() => insert('\n## ')}>Subtítulo</button>
            <button type="button" onClick={() => insert('**', '**')}>Negrito</button>
            <button type="button" onClick={() => insert('\n- ')}>Lista</button>
            <button type="button" onClick={() => insert('\n1. ')}>Passos</button>
            <button type="button" onClick={() => insert('[', '](https://)')}>Link</button>
            <button type="button" disabled={uploading} onClick={() => imageInput.current?.click()}>
              {uploading ? 'Subindo…' : 'Imagem'}
            </button>
          </div>
          <div className="ed-tabs">
            <button type="button" aria-pressed={tab === 'write'} onClick={() => setTab('write')}>Escrever</button>
            <button type="button" aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>Pré-visualizar</button>
          </div>
        </div>
        <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          const url = file && (await uploadImage(file))
          if (url) insert(`\n![${file.name.replace(/\.\w+$/, '')}](${url})\n`)
        }} />
        <textarea id="bodyMd" name="bodyMd" ref={bodyRef} rows={22} value={body} onChange={(e) => setBody(e.target.value)}
          hidden={tab === 'preview'} required className="ed-body" />
        {tab === 'preview' && <div className="ed-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />}
        {uploadError && <p className="adm-error">{uploadError}</p>}

        <label>Perguntas frequentes</label>
        <input type="hidden" name="faq" value={JSON.stringify(faq)} />
        <ol className="ed-faq">
          {faq.map((f, i) => (
            <li key={i}>
              <input aria-label={`Pergunta ${i + 1}`} placeholder="Pergunta" value={f.q} onChange={(e) => setFaqItem(i, { q: e.target.value })} />
              <textarea aria-label={`Resposta ${i + 1}`} placeholder="Resposta" rows={2} value={f.a} onChange={(e) => setFaqItem(i, { a: e.target.value })} />
              <button type="button" className="btn danger" onClick={() => setFaq(faq.filter((_, j) => j !== i))}>Remover</button>
            </li>
          ))}
        </ol>
        <button type="button" className="btn ghost" onClick={() => setFaq([...faq, { q: '', a: '' }])}>+ Pergunta</button>

        <label htmlFor="slug">Endereço (slug)</label>
        <input id="slug" name="slug" defaultValue={source?.slug} placeholder="gerado a partir do título" />
        <p className="hint">lyrioapp.com/pt-BR/blog/<b>{source?.slug || '…'}</b>/. Evite mudar depois de publicado.</p>

        <label htmlFor="metaDescription">Meta description</label>
        <input id="metaDescription" name="metaDescription" defaultValue={source?.metaDescription} maxLength={200} />
        <p className="hint">Até 155 caracteres. Aparece no Google.</p>

        <input type="hidden" name="coverUrl" value={cover} />
      </form>

      <aside className="ed-side">
        <section className="adm-panel">
          <h2>{published ? 'Publicado' : post ? 'Rascunho' : 'Novo'}</h2>
          {published ? (
            <>
              <button form="editor" className="btn" name="intent" value="publish" disabled={pending}>
                {pending ? 'Salvando…' : 'Salvar e republicar'}
              </button>
              <p className="hint">Republicar refaz as traduções.</p>
              <p><a href={blogHref('pt-BR', source!.slug)} target="_blank" rel="noreferrer">Ver no blog ↗</a></p>
            </>
          ) : (
            <div className="ed-actions">
              <button form="editor" className="btn ghost" name="intent" value="draft" disabled={pending}>Salvar rascunho</button>
              <button form="editor" className="btn" name="intent" value="publish" disabled={pending}>
                {pending ? 'Salvando…' : 'Publicar'}
              </button>
            </div>
          )}
          {state.error && <p className="adm-error" role="alert">{state.error}</p>}
          {state.ok && <p className="adm-ok">{state.ok}</p>}
        </section>

        <section className="adm-panel">
          <h2>Capa</h2>
          {cover ? (
            <>
              <img className="ed-cover" src={cover} alt="" />
              <button type="button" className="btn danger" onClick={() => setCover('')}>Remover capa</button>
            </>
          ) : (
            <p className="hint">Opcional. Sem capa, o blog gera uma imagem com o título para compartilhamento.</p>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir capa" disabled={uploading} onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            const url = file && (await uploadImage(file))
            if (url) setCover(url)
          }} />
          <p className="hint">A capa vale depois de salvar.</p>
        </section>

        {published && (
          <TranslationPanel postId={post.id} missing={props.missing} autoTranslate={props.autoTranslate}
            models={props.models} defaultModel={props.defaultTranslator} />
        )}

        {post && (
          <section className="adm-panel">
            {published && (
              <form action={unpublishPost.bind(null, post.id)}>
                <button className="btn ghost">Despublicar</button>
              </form>
            )}
            <form action={deletePostAction.bind(null, post.id)}
              onSubmit={(e) => { if (!confirm('Excluir este artigo e todas as traduções?')) e.preventDefault() }}>
              <button className="btn danger">Excluir artigo</button>
            </form>
          </section>
        )}
      </aside>
    </div>
  )
}
