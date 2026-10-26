'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AiError, isModelId } from '@/lib/ai/openrouter'
import { writeArticle } from '@/lib/ai/write'
import { checkPassword, SESSION_COOKIE, SESSION_DAYS, signSession } from '@/lib/auth'
import { getSql } from '@/lib/db'
import { parseEditorForm } from '@/lib/editor-form'
import { type Locale } from '@/lib/locales'
import {
  createPost, deletePost, getPostForEdit, listVersionsOf, missingLocales, publish, unpublish, updateSource,
} from '@/lib/posts'
import { pathsFor } from '@/lib/revalidate'
import { getAbout, setAbout } from '@/lib/settings'
import type { PostType } from '@/lib/types'
import { requireAdmin } from './guard'

type Msg = { error?: string; ok?: string }

export async function login(_prev: Msg, fd: FormData): Promise<Msg> {
  if (!checkPassword(String(fd.get('password') ?? ''))) {
    await new Promise((r) => setTimeout(r, 800))
    return { error: 'Senha incorreta.' }
  }
  const secret = process.env.SESSION_SECRET ?? ''
  if (!secret) return { error: 'O admin não está configurado (falta SESSION_SECRET).' }
  ;(await cookies()).set(SESSION_COOKIE, signSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
  redirect('/admin')
}

export async function logout(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}

function revalidateBlog(versions: { locale: Locale; slug: string }[]) {
  for (const p of pathsFor(versions)) revalidatePath(p)
  revalidatePath('/admin')
}

export type DraftState = { error?: string; topic?: string; type?: string; model?: string }

export async function generateDraft(_prev: DraftState, fd: FormData): Promise<DraftState> {
  await requireAdmin()
  const keep = {
    topic: String(fd.get('topic') ?? '').trim(),
    type: String(fd.get('type') ?? ''),
    model: String(fd.get('model') ?? '').trim(),
  }
  if (!keep.topic) return { ...keep, error: 'Escreva sobre o que o artigo vai falar.' }
  if (!['artigo', 'faq', 'tutorial'].includes(keep.type)) return { ...keep, error: 'Tipo inválido.' }
  if (!isModelId(keep.model)) return { ...keep, error: 'Modelo inválido.' }
  const sql = getSql()
  const about = await getAbout(sql)
  if (!about.trim()) return { ...keep, error: "Preencha 'Sobre o Lyrio' antes de gerar com IA." }

  let id: string
  try {
    const type = keep.type as PostType
    const source = await writeArticle({ topic: keep.topic, type }, about, keep.model)
    id = await createPost(sql, { type, topic: keep.topic, source })
  } catch (e) {
    if (e instanceof AiError) return { ...keep, error: e.message }
    throw e
  }
  revalidatePath('/admin')
  redirect(`/admin/artigos/${id}`)
}

// Rascunho salva sem publicar. Artigo já publicado sempre republica, para as traduções não ficarem para trás.
export async function saveEditor(id: string | null, _prev: Msg, fd: FormData): Promise<Msg> {
  await requireAdmin()
  const parsed = parseEditorForm(fd)
  if (!parsed.ok) return { error: parsed.error }
  const sql = getSql()
  const current = id ? await getPostForEdit(sql, id) : null
  if (id && !current) return { error: 'Artigo não encontrado.' }

  const postId = id ?? (await createPost(sql, parsed.value))
  if (id) await updateSource(sql, id, parsed.value)

  const wantsPublish = fd.get('intent') === 'publish' || current?.post.status === 'published'
  if (wantsPublish) {
    await publish(sql, postId)
    revalidateBlog(await listVersionsOf(sql, postId))
    redirect(`/admin/artigos/${postId}?traduzir=1`)
  }
  revalidatePath('/admin')
  if (!id) redirect(`/admin/artigos/${postId}`)
  return { ok: 'Rascunho salvo.' }
}

export async function unpublishPost(id: string): Promise<void> {
  await requireAdmin()
  const sql = getSql()
  await unpublish(sql, id)
  revalidateBlog(await listVersionsOf(sql, id))
  redirect(`/admin/artigos/${id}`)
}

export async function deletePostAction(id: string): Promise<void> {
  await requireAdmin()
  const sql = getSql()
  const versions = await listVersionsOf(sql, id)
  await deletePost(sql, id)
  revalidateBlog(versions)
  redirect('/admin')
}

export async function getMissing(id: string): Promise<Locale[]> {
  await requireAdmin()
  return missingLocales(getSql(), id)
}

export async function saveAbout(_prev: Msg, fd: FormData): Promise<Msg> {
  await requireAdmin()
  await setAbout(getSql(), String(fd.get('about') ?? '').trim())
  revalidatePath('/llms.txt')
  return { ok: 'Salvo.' }
}
