import { z } from 'zod'
import { SITE_URL } from '../site'

export const DEFAULT_WRITER_MODEL = 'anthropic/claude-opus-5.5'
export const DEFAULT_TRANSLATOR_MODEL = 'anthropic/claude-sonnet-5.5'

const API = 'https://openrouter.ai/api/v1'

export class AiError extends Error {}

export function isModelId(s: string): boolean {
  return /^~?[\w.-]+\/[\w.:-]+$/.test(s)
}

export function jsonSchemaFor(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>
  return rest
}

export async function chatJson<T>(
  o: { model: string; system: string; user: string; schema: z.ZodType<T>; name: string },
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new AiError('OPENROUTER_API_KEY não configurada.')

  const res = await fetchImpl(`${API}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': SITE_URL,
      'X-Title': 'Lyrio Blog',
    },
    body: JSON.stringify({
      model: o.model,
      messages: [
        { role: 'system', content: o.system },
        { role: 'user', content: o.user },
      ],
      response_format: { type: 'json_schema', json_schema: { name: o.name, strict: true, schema: jsonSchemaFor(o.schema) } },
      provider: { require_parameters: true },
      max_tokens: 16000,
    }),
    signal: AbortSignal.timeout(280_000),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new AiError(`Erro do OpenRouter: ${body?.error?.message ?? res.status}`)

  const choice = body?.choices?.[0]
  if (choice?.finish_reason === 'length') throw new AiError('O texto ficou longo demais e foi cortado. Tente um tema mais específico.')
  if (choice?.finish_reason === 'content_filter' || choice?.message?.refusal) {
    throw new AiError('A IA recusou este tema. Tente reformular ou escolher outro modelo.')
  }
  try {
    const parsed = o.schema.safeParse(JSON.parse(choice?.message?.content ?? ''))
    if (parsed.success) return parsed.data
  } catch {}
  throw new AiError('A IA devolveu um formato inválido. Tente de novo ou escolha outro modelo.')
}

export type ModelOption = { id: string; name: string; prompt: number; completion: number }

export async function listModels(): Promise<ModelOption[]> {
  try {
    const res = await fetch(`${API}/models`, { next: { revalidate: 3600 } } as RequestInit)
    const { data } = await res.json()
    return (data as any[])
      .filter((m) => m.supported_parameters?.includes('structured_outputs') && !m.id.endsWith(':batch'))
      .map((m) => ({ id: m.id, name: m.name, prompt: Number(m.pricing?.prompt) * 1e6, completion: Number(m.pricing?.completion) * 1e6 }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return [] // sem lista, o campo ainda aceita o id digitado
  }
}
