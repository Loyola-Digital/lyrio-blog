'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ModelOption } from '@/lib/ai/openrouter'
import { NATIVE_NAME, TARGET_LOCALES, type Locale } from '@/lib/locales'
import { runPool } from '@/lib/pool'
import { getMissing } from '../../actions'
import { ModelPicker, readSavedModel, useSavedModel } from '../../ModelPicker'
import { requestTranslation } from '../../translate-client'

const TOTAL = TARGET_LOCALES.length
const KEY = 'lyrio.translatorModel'

export function TranslationPanel(props: {
  postId: string
  missing: Locale[]
  autoTranslate: boolean
  models: ModelOption[]
  defaultModel: string
}) {
  const router = useRouter()
  const [missing, setMissing] = useState(props.missing)
  const [model, setModel] = useSavedModel(KEY, props.defaultModel)
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
      (locale) => requestTranslation(props.postId, locale, withModel),
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
    // na hidratação o hook ainda devolve o padrão; lê a escolha salva direto
    run(props.missing, readSavedModel(KEY) || model)
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
      <ModelPicker name="translatorModel" value={model} onChange={setModel} models={props.models} />
    </section>
  )
}
