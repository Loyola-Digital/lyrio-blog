import { describe, expect, it } from 'vitest'
import { FALLBACK_MODELS, groupModels, RECOMMENDED_MODELS } from '@/lib/ai/model-groups'

const m = (id: string, name: string, prompt = 1, completion = 2) => ({ id, name, prompt, completion })
const models = [
  m('openai/gpt-5.6-luna', 'OpenAI: GPT-5.6 Luna'),
  m('anthropic/claude-sonnet-5.5', 'Anthropic: Claude Sonnet 5.5', 2, 10),
  m('anthropic/claude-opus-5.5', 'Anthropic: Claude Opus 5.5', 4, 20),
  m('qwen/qwen3.8-flash', 'Qwen: Qwen3.8 Flash'),
]

describe('groupModels', () => {
  it('põe os recomendados no topo, na ordem da recomendação, e o resto por empresa', () => {
    const groups = groupModels(models, 'anthropic/claude-sonnet-5.5')
    expect(groups[0].label).toBe('Recomendados')
    expect(groups[0].options.map((o) => o.id)).toEqual(
      RECOMMENDED_MODELS.filter((id) => models.some((x) => x.id === id)))
    expect(groups.slice(1).map((g) => g.label)).toEqual(['Anthropic', 'OpenAI', 'Qwen'])
    expect(groups[0].options.find((o) => o.id === 'anthropic/claude-opus-5.5')!.label).toBe('Claude Opus 5.5 · $4.00 / $20.00 por 1M')
  })

  it('mantém na lista o modelo escolhido mesmo que ele não venha do OpenRouter', () => {
    const groups = groupModels(models, 'meu/modelo-x')
    expect(groups[0]).toEqual({ label: 'Escolhido', options: [{ id: 'meu/modelo-x', label: 'meu/modelo-x' }] })
  })

  it('sem a lista do OpenRouter, oferece os recomendados mesmo assim', () => {
    const groups = groupModels([], 'anthropic/claude-sonnet-5.5')
    expect(groups).toHaveLength(1)
    expect(groups[0].options.map((o) => o.id)).toEqual(FALLBACK_MODELS.map((f) => f.id))
  })
})
