'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ModelOption } from '@/lib/ai/openrouter'
import { runPool } from '@/lib/pool'
import { getAllMissing } from './actions'
import { ModelPicker, useSavedModel } from './ModelPicker'
import { requestTranslation } from './translate-client'

// Traduz de uma vez tudo o que falta em todos os artigos publicados. A aba precisa ficar aberta até o fim.
export function TranslateAll(props: { missing: number; articles: number; models: ModelOption[]; defaultModel: string }) {
  const router = useRouter()
  const [model, setModel] = useSavedModel('lyrio.translatorModel', props.defaultModel)
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null)
  const [lastError, setLastError] = useState('')

  async function run() {
    const pairs = await getAllMissing()
    setLastError('')
    setProgress({ done: 0, total: pairs.length, failed: 0 })
    await runPool(pairs, 4, (p) => requestTranslation(p.postId, p.locale, model), (_p, error) => {
      setProgress((s) => s && { ...s, done: s.done + 1, failed: s.failed + (error ? 1 : 0) })
      if (error) setLastError(String((error as Error).message ?? error))
    })
    router.refresh()
  }

  if (!props.missing && !progress) return null
  const running = progress && progress.done < progress.total

  return (
    <section className="adm-panel adm-translate-all">
      <h2>Traduções pendentes</h2>
      {progress ? (
        <>
          <p className="num">
            {running ? 'Traduzindo' : 'Terminado:'} {progress.done}/{progress.total}
            {progress.failed > 0 && ` · ${progress.failed} com erro`}
          </p>
          <progress max={progress.total} value={progress.done} style={{ width: '100%' }} />
          {running && <p className="hint">Deixe esta aba aberta até terminar. Leva alguns minutos por artigo.</p>}
        </>
      ) : (
        <p className="num">{props.missing} traduções faltando em {props.articles} artigos publicados.</p>
      )}
      {lastError && <p className="adm-error">Último erro: {lastError}</p>}
      <label>Modelo da tradução</label>
      <ModelPicker name="translatorModel" value={model} onChange={setModel} models={props.models} />
      <p>
        <button type="button" className="btn" disabled={!!running} onClick={run}>
          {running ? 'Traduzindo…' : progress?.failed ? 'Tentar as que faltam' : 'Traduzir tudo'}
        </button>
      </p>
    </section>
  )
}
