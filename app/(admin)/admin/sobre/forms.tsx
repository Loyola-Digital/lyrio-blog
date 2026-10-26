'use client'

import { saveAbout } from '../actions'
import { useNoResetAction } from '../useNoResetAction'

export function AboutForm({ about }: { about: string }) {
  const [state, onSubmit, pending] = useNoResetAction(saveAbout, {})
  return (
    <form onSubmit={onSubmit}>
      <textarea name="about" rows={24} defaultValue={about} aria-label="Sobre o Lyrio" />
      {state.ok && <p className="adm-ok">{state.ok}</p>}
      <p><button className="btn" disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button></p>
    </form>
  )
}
