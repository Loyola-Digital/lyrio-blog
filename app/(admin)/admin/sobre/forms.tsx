'use client'

import { saveAbout, saveGlossary } from '../actions'
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

export function GlossaryForm({ locale, text }: { locale: string; text: string }) {
  const [state, onSubmit, pending] = useNoResetAction(saveGlossary, {})
  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="locale" value={locale} />
      <textarea name="terms" rows={18} defaultValue={text} aria-label="Glossário"
        placeholder={'Ainda não gerado para este idioma.\nFormato: termo em português = tradução\nOpção Nuclear = Nuclear Option'} />
      {state.error && <p className="adm-error">{state.error}</p>}
      {state.ok && <p className="adm-ok">{state.ok}</p>}
      <p><button className="btn" disabled={pending}>{pending ? 'Salvando…' : 'Salvar glossário'}</button></p>
    </form>
  )
}
