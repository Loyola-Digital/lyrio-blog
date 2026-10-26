'use client'

import { useState, useSyncExternalStore } from 'react'
import { groupModels } from '@/lib/ai/model-groups'
import type { ModelOption } from '@/lib/ai/openrouter'

export function readSavedModel(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

// Último modelo escolhido (localStorage), sem setState em effect: no servidor vale o padrão.
export function useSavedModel(key: string, fallback: string): [string, (model: string) => void] {
  const saved = useSyncExternalStore(subscribe, () => readSavedModel(key), () => null)
  const [typed, setTyped] = useState<string | null>(null)
  const set = (model: string) => {
    setTyped(model)
    try {
      localStorage.setItem(key, model)
    } catch {}
  }
  return [typed ?? saved ?? fallback, set]
}

export function ModelPicker(props: { name: string; value: string; onChange: (model: string) => void; models: ModelOption[] }) {
  return (
    <>
      <select name={props.name} value={props.value} onChange={(e) => props.onChange(e.target.value)} required>
        {groupModels(props.models, props.value).map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </optgroup>
        ))}
      </select>
      <p className="hint">Preço do OpenRouter por 1 milhão de tokens (entrada / saída). Os recomendados estão no topo.</p>
    </>
  )
}
