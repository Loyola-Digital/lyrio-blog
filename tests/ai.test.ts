import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { chatJson, isModelId, jsonSchemaFor } from '@/lib/ai/openrouter'
import { DraftSchema } from '@/lib/ai/schemas'
import { FEATURE_TERMS, formatGlossaryText, parseGlossaryText, translatorUser } from '@/lib/ai/translate'
import { toVersionFields, writerSystem } from '@/lib/ai/write'
import { src } from './helpers/db'

const ok = (content: string, finish = 'stop') =>
  vi.fn(async (_url: string, _init: any) =>
    new Response(JSON.stringify({ choices: [{ finish_reason: finish, message: { content } }] }), { status: 200 }))
const S = z.strictObject({ a: z.number() })

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'k'
})

describe('chatJson', () => {
  it('monta o pedido para o OpenRouter', async () => {
    const f = ok('{"a":1}')
    expect(await chatJson({ model: 'anthropic/claude-opus-5.5', system: 'SYS', user: 'U', schema: S, name: 'x' }, f as any)).toEqual({ a: 1 })
    const [url, init] = f.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer k')
    expect(body).toMatchObject({
      model: 'anthropic/claude-opus-5.5',
      provider: { require_parameters: true },
      messages: [{ role: 'system', content: 'SYS' }, { role: 'user', content: 'U' }],
      response_format: { type: 'json_schema', json_schema: { name: 'x', strict: true } },
    })
  })

  it('transforma erros em mensagens em português', async () => {
    const run = (f: any) => chatJson({ model: 'm/x', system: '', user: '', schema: S, name: 'x' }, f)
    await expect(run(ok('{"a":1}', 'length'))).rejects.toThrow('O texto ficou longo demais e foi cortado. Tente um tema mais específico.')
    await expect(run(ok('{"a":1}', 'content_filter'))).rejects.toThrow('A IA recusou este tema. Tente reformular ou escolher outro modelo.')
    await expect(run(ok('não é json'))).rejects.toThrow('A IA devolveu um formato inválido. Tente de novo ou escolha outro modelo.')
    await expect(run(ok('{"b":1}'))).rejects.toThrow('A IA devolveu um formato inválido. Tente de novo ou escolha outro modelo.')
    await expect(run(vi.fn(async () => new Response('{"error":{"message":"No endpoints found"}}', { status: 404 }))))
      .rejects.toThrow('Erro do OpenRouter: No endpoints found')
    await expect(run(vi.fn(async () => { throw new TypeError('fetch failed') })))
      .rejects.toThrow('Não foi possível falar com o OpenRouter: fetch failed')
    await expect(run(vi.fn(async () => new Response('{"error":{"message":"Provider returned error"}}', { status: 200 }))))
      .rejects.toThrow('Erro do OpenRouter: Provider returned error')
    delete process.env.OPENROUTER_API_KEY
    await expect(run(ok('{"a":1}'))).rejects.toThrow('OPENROUTER_API_KEY não configurada.')
  })
})

describe('modelos e schema', () => {
  it('valida o id do modelo', () => {
    expect(isModelId('anthropic/claude-opus-5.5')).toBe(true)
    expect(isModelId('~deepseek/deepseek-flash-latest')).toBe(true)
    expect(isModelId('openai/gpt-5.6-luna:batch')).toBe(true)
    expect(isModelId('foo')).toBe(false)
    expect(isModelId('a/b c')).toBe(false)
    expect(isModelId('')).toBe(false)
  })

  it('gera json schema strict sem $schema', () => {
    const js = jsonSchemaFor(DraftSchema) as any
    expect(js.$schema).toBeUndefined()
    expect(js.additionalProperties).toBe(false)
    expect([...js.required].sort()).toEqual(['body_md', 'faq', 'headline', 'meta_description', 'slug', 'summary', 'title'])
  })
})

describe('escrita e tradução', () => {
  it('converte o rascunho da IA', () => {
    expect(toVersionFields({
      title: ' T ', headline: 'h', summary: 's', body_md: 'b', slug: '', meta_description: 'm',
      faq: [{ q: 'q', a: 'a' }, { q: ' ', a: 'x' }],
    })).toEqual({ title: 'T', headline: 'h', summary: 's', bodyMd: 'b', slug: 't', metaDescription: 'm', faq: [{ q: 'q', a: 'a' }] })
  })

  it('monta o prompt de escrita com o Sobre o Lyrio', () => {
    const sys = writerSystem('SOBRE-XYZ')
    expect(sys).toContain('<sobre>\nSOBRE-XYZ\n</sobre>')
    expect(sys).toContain('sem pregação')
    expect(sys).toContain('Nunca prometa cura')
  })

  it('monta o pedido de tradução com idioma e glossário', () => {
    const u = translatorUser(src(), 'de', { 'Opção Nuclear': 'Nuklearoption' })
    expect(u).toContain('German')
    expect(u).toContain('Opção Nuclear → Nuklearoption')
    expect(u).toContain('"body_md"')
  })

  it('lê e escreve o glossário como texto', () => {
    expect(parseGlossaryText('Socorro = Hilfe\n\n Opção Nuclear=Nuklearoption \nlixo')).toEqual({ Socorro: 'Hilfe', 'Opção Nuclear': 'Nuklearoption' })
    expect(parseGlossaryText(formatGlossaryText({ A: 'b' }))).toEqual({ A: 'b' })
    expect(FEATURE_TERMS).toContain('Opção Nuclear')
  })
})
