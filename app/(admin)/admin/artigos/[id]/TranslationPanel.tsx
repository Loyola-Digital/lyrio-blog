'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ModelOption } from '@/lib/ai/openrouter'
import { NATIVE_NAME, TARGET_LOCALES, type Locale } from '@/lib/locales'
import { runPool } from '@/lib/pool'
import { getMissing } from '../../actions'
import { ModelPicker } from '../../ModelPicker'

const TOTAL = TARGET_LOCALES.length

export function TranslationPanel(props: {
  postId: string
  missing: Locale[]
  autoTranslate: boolean
  models: ModelOption[]
  defaultModel: string
}) {
  const router = useRouter()
  const [missing, setMissing] = useState(props.missing)
  const [model, setModel] = useState(props.defaultModel)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [lastError, setLastError] = useState('')
  const started = useRef(false)

  async function run(locales: Locale[], withModel = model) {
    if (!locales.length) return
    setLastError('')
    setProgress({ done: 0, total: locales.length })
    await runPool(
      locales,
      4,
      async (locale) => {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: props.postId, locale, model: withModel }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`)
      },
      (_locale, error) => {
        setProgress((p) => p && { ...p, done: p.done + 1 })
        if (error) setLastError(String((error as Error).message ?? error))
      },
    )
    setMissing(await getMissing(props.postId))
    setProgress(null)
    router.replace(`/admin/artigos/${props.postId}`)
  }

  useEffect(() => {
    if (!props.autoTranslate || started.current) return
    started.current = true
    // o ModelPicker carrega o último modelo do localStorage; espera um tique para usá-lo
    const saved = (() => {
      try {
        return localStorage.getItem('lyrio.translatorModel')
      } catch {
        return null
      }
    })()
    run(props.missing, saved || model)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="adm-panel">
      <h2>Traduções</h2>
      {progress ? (
        <>
          <p className="num">Traduzindo {progress.done}/{progress.total}…</p>
          <progress max={progress.total} value={progress.done} style={{ width: '100%' }} />
          <p className="hint">Deixe esta aba aberta até terminar.</p>
        </>
      ) : (
        <>
          <p className="num">{TOTAL - missing.length}/{TOTAL} idiomas</p>
          {missing.length > 0 && (
            <>
              <p className="hint">Faltam: {missing.map((l) => NATIVE_NAME[l]).join(', ')}.</p>
              <button type="button" className="btn ghost" onClick={() => run(missing)}>Traduzir faltantes</button>
            </>
          )}
        </>
      )}
      {lastError && <p className="adm-error">Último erro: {lastError}</p>}
      <label>Modelo da tradução</label>
      <ModelPicker name="translatorModel" storageKey="lyrio.translatorModel" defaultModel={props.defaultModel} models={props.models} onChange={setModel} />
    </section>
  )
}
