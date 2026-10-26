'use client'

import { useEffect, useId, useState } from 'react'
import type { ModelOption } from '@/lib/ai/openrouter'

const price = (n: number) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : '?')

export function ModelPicker(props: {
  name: string
  storageKey: string
  defaultModel: string
  models: ModelOption[]
  value?: string
  onChange?: (model: string) => void
}) {
  const listId = useId()
  const [value, setValue] = useState(props.value || props.defaultModel)

  useEffect(() => {
    if (props.value) return
    try {
      const saved = localStorage.getItem(props.storageKey)
      if (saved) {
        setValue(saved)
        props.onChange?.(saved)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function change(v: string) {
    setValue(v)
    props.onChange?.(v)
    try {
      localStorage.setItem(props.storageKey, v)
    } catch {}
  }

  return (
    <>
      <input name={props.name} list={listId} value={value} onChange={(e) => change(e.target.value)} spellCheck={false} required />
      <datalist id={listId}>
        {props.models.map((m) => (
          <option key={m.id} value={m.id}>{`${m.name} · ${price(m.prompt)}/${price(m.completion)} por 1M`}</option>
        ))}
      </datalist>
      <p className="hint">Qualquer modelo do OpenRouter com saída estruturada. Comece a digitar para filtrar.</p>
    </>
  )
}
