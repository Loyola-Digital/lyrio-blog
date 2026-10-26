'use client'

import { startTransition, useActionState, type FormEvent } from 'react'

// <form action> do React 19 limpa os campos depois da ação, inclusive quando ela devolve erro.
// Disparando pela onSubmit, o que a pessoa digitou fica no lugar.
export function useNoResetAction<S>(fn: (prev: Awaited<S>, fd: FormData) => S | Promise<S>, initial: Awaited<S>) {
  const [state, dispatch, pending] = useActionState<S, FormData>(fn, initial)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter
    const fd = new FormData(e.currentTarget, submitter)
    startTransition(() => dispatch(fd))
  }
  return [state, onSubmit, pending] as const
}
