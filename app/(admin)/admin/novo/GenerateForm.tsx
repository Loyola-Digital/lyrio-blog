'use client'

import type { ModelOption } from '@/lib/ai/openrouter'
import { generateDraft, type DraftState } from '../actions'
import { ModelPicker, useSavedModel } from '../ModelPicker'
import { useNoResetAction } from '../useNoResetAction'

export function GenerateForm({ models, defaultModel }: { models: ModelOption[]; defaultModel: string }) {
  const [state, onSubmit, pending] = useNoResetAction(generateDraft, {} as DraftState)
  const [model, setModel] = useSavedModel('lyrio.writerModel', defaultModel)
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="topic">Sobre o que vai falar?</label>
      <textarea id="topic" name="topic" rows={4} required placeholder="Ex.: como usar o botão Socorro numa crise de madrugada" />
      <label htmlFor="type">Tipo</label>
      <select id="type" name="type" defaultValue="artigo">
        <option value="artigo">Artigo</option>
        <option value="faq">Perguntas (FAQ)</option>
        <option value="tutorial">Guia prático (tutorial)</option>
      </select>
      <label>Modelo</label>
      <ModelPicker name="model" value={model} onChange={setModel} models={models} />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <p><button className="btn" disabled={pending}>{pending ? 'Escrevendo… pode levar até 2 minutos' : 'Gerar com IA'}</button></p>
      <p className="hint">O texto cai no editor como rascunho. Nada vai ao ar sem você clicar em Publicar.</p>
    </form>
  )
}
