import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/app/(admin)/admin/guard'
import { AiError, isModelId } from '@/lib/ai/openrouter'
import { makeGlossary, translateVersion } from '@/lib/ai/translate'
import { getSql } from '@/lib/db'
import { isLocale } from '@/lib/locales'
import { translateOne, TranslateError } from '@/lib/translate-one'

export const maxDuration = 300

const fail = (error: string, status: number) => Response.json({ error }, { status })

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail('Não autorizado.', 401)
  const { postId, locale, model } = await req.json().catch(() => ({}))
  if (typeof postId !== 'string') return fail('Artigo inválido.', 400)
  if (typeof locale !== 'string' || !isLocale(locale)) return fail('Idioma inválido.', 400)
  if (typeof model !== 'string' || !isModelId(model)) return fail('Modelo inválido.', 400)

  try {
    const out = await translateOne(getSql(), postId, locale, model, { translate: translateVersion, makeGlossary })
    for (const p of out.paths) revalidatePath(p)
    revalidatePath('/admin')
    return Response.json({ locale, slug: out.slug })
  } catch (e) {
    if (e instanceof TranslateError) return fail(e.message, e.status)
    if (e instanceof AiError) return fail(e.message, 502)
    throw e
  }
}
