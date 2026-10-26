'use client'

import { useId, useState, useSyncExternalStore } from 'react'
import type { ModelOption } from '@/lib/ai/openrouter'

const price = (n: number) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : '?')

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
  const listId = useId()
  return (
    <>
      <input name={props.name} list={listId} value={props.value} onChange={(e) => props.onChange(e.target.value)} spellCheck={false} required />
      <datalist id={listId}>
        {props.models.map((m) => (
          <option key={m.id} value={m.id}>{`${m.name} · ${price(m.prompt)}/${price(m.completion)} por 1M`}</option>
        ))}
      </datalist>
      <p className="hint">Qualquer modelo do OpenRouter com saída estruturada. Comece a digitar para filtrar.</p>
    </>
  )
}
