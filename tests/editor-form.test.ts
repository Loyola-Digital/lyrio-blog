import { describe, expect, it } from 'vitest'
import { parseEditorForm } from '@/lib/editor-form'
import { wrapSelection } from '@/lib/md-insert'

const fd = (o: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(o)) f.set(k, v)
  return f
}
const base = {
  type: 'faq', title: 'O Lyrio é anônimo?', headline: '', summary: 's', slug: '', metaDescription: '', bodyMd: 'b',
  faq: '[{"q":"a","a":"b"},{"q":"","a":"x"}]', coverUrl: '',
}

describe('parseEditorForm', () => {
  it('lê o formulário, gera slug e limpa perguntas vazias', () => {
    expect(parseEditorForm(fd(base))).toEqual({
      ok: true,
      value: {
        type: 'faq', coverUrl: null,
        source: { title: 'O Lyrio é anônimo?', headline: '', summary: 's', slug: 'o-lyrio-e-anonimo', metaDescription: '', bodyMd: 'b', faq: [{ q: 'a', a: 'b' }] },
      },
    })
  })

  it('normaliza o slug digitado', () => {
    expect((parseEditorForm(fd({ ...base, slug: 'Meu Slug Ação' })) as any).value.source.slug).toBe('meu-slug-acao')
  })

  it('recusa título, texto ou tipo faltando', () => {
    expect(parseEditorForm(fd({ ...base, title: ' ' }))).toEqual({ ok: false, error: 'Preencha o título.' })
    expect(parseEditorForm(fd({ ...base, bodyMd: '' }))).toEqual({ ok: false, error: 'Escreva o texto.' })
    expect(parseEditorForm(fd({ ...base, type: 'x' }))).toEqual({ ok: false, error: 'Tipo inválido.' })
    expect(parseEditorForm(fd({ ...base, title: '???' }))).toEqual({ ok: false, error: 'O título precisa ter letras ou números.' })
  })

  it('ignora FAQ quebrado', () => {
    expect((parseEditorForm(fd({ ...base, faq: '{quebrado' })) as any).value.source.faq).toEqual([])
  })
})

describe('wrapSelection', () => {
  it('envolve a seleção e põe o cursor depois', () => {
    expect(wrapSelection('abc', 1, 2, '**', '**')).toEqual({ value: 'a**b**c', cursor: 6 })
  })
})
