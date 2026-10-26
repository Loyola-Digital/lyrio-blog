'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

// Erro inesperado numa tela do admin (banco fora do ar, por exemplo): mensagem em português em vez da página genérica.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  // erro veio do servidor: refresh busca os dados de novo, reset limpa o estado de erro
  const retry = () => startTransition(() => {
    router.refresh()
    reset()
  })
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1>Algo deu errado</h1>
      </header>
      <p>Não foi possível carregar esta tela. Pode ser uma falha passageira do banco ou da rede.</p>
      <p className="hint">Se continuar, mande este código para quem cuida do sistema: <code>{error.digest ?? 'sem código'}</code></p>
      <p className="ed-inline">
        <button className="btn" onClick={retry}>Tentar de novo</button>
        <Link className="btn ghost" href="/admin">Voltar para a lista</Link>
      </p>
    </main>
  )
}
