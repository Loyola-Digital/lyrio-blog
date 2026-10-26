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

  let res: Response
  try {
    res = await fetchImpl(`${API}/chat/completions`, {
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
  } catch (e) {
    // rede fora, DNS, timeout: vira mensagem legível em vez da página de erro do Next
    throw new AiError(`Não foi possível falar com o OpenRouter: ${(e as Error).message}`)
  }
  const body = await res.json().catch(() => ({}))
  // o OpenRouter devolve 200 com { error } quando o provedor falha
  if (!res.ok || body?.error) throw new AiError(`Erro do OpenRouter: ${body?.error?.message ?? res.status}`)

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
type OpenRouterModel = { id: string; name: string; supported_parameters?: string[]; pricing?: { prompt?: string; completion?: string } }

// Em memória, não no cache de dados do Next: o catálogo passa do limite de 2 MB por entrada.
let catalog: { at: number; models: ModelOption[] } | null = null

export async function listModels(fetchImpl: typeof fetch = fetch): Promise<ModelOption[]> {
  if (catalog && Date.now() - catalog.at < 3600_000) return catalog.models
  try {
    const res = await fetchImpl(`${API}/models`, { cache: 'no-store' })
    const { data } = await res.json()
    const models = (data as OpenRouterModel[])
      .filter((m) => m.supported_parameters?.includes('structured_outputs') && !m.id.endsWith(':batch'))
      .map((m) => ({ id: m.id, name: m.name, prompt: Number(m.pricing?.prompt) * 1e6, completion: Number(m.pricing?.completion) * 1e6 }))
      .sort((a, b) => a.name.localeCompare(b.name))
    catalog = { at: Date.now(), models }
    return models
  } catch {
    return [] // sem lista, o campo ainda aceita o id digitado
  }
}
