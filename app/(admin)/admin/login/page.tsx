'use client'

import { useActionState } from 'react'
import { login } from '../actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {})
  return (
    <main className="adm-login">
      <form action={action}>
        <p className="adm-brand">
          <img src="/logo.webp" alt="" width={28} height={28} /> Lyrio <span>Artigos</span>
        </p>
        <label htmlFor="password">Senha do time</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        {state.error && <p className="adm-error" role="alert">{state.error}</p>}
        <button className="btn" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  )
}
