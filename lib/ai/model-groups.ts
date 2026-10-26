import type { ModelOption } from './openrouter'

// Bons para escrever e traduzir, do mais caro ao mais barato. Ficam no topo do seletor.
export const RECOMMENDED_MODELS = [
  'anthropic/claude-opus-5.5',
  'anthropic/claude-sonnet-5.5',
  'anthropic/claude-haiku-5.5',
  'google/gemini-3.8-flash',
  'openai/gpt-5.6-luna',
  'x-ai/grok-4.7',
  'deepseek/deepseek-v4.1-flash',
]

// Se a lista do OpenRouter não carregar, o seletor ainda oferece estes.
export const FALLBACK_MODELS = [
  { id: 'anthropic/claude-opus-5.5', label: 'Claude Opus 5.5' },
  { id: 'anthropic/claude-sonnet-5.5', label: 'Claude Sonnet 5.5' },
  { id: 'anthropic/claude-haiku-5.5', label: 'Claude Haiku 5.5' },
  { id: 'google/gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { id: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna' },
  { id: 'x-ai/grok-4.7', label: 'Grok 4.7' },
  { id: 'deepseek/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' },
]

type Group = { label: string; options: { id: string; label: string }[] }

const money = (n: number) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : '?')
const provider = (m: ModelOption) => (m.name.includes(':') ? m.name.split(':')[0].trim() : m.id.split('/')[0])
const optionOf = (m: ModelOption) => ({
  id: m.id,
  label: `${m.name.includes(':') ? m.name.split(':').slice(1).join(':').trim() : m.name} · ${money(m.prompt)} / ${money(m.completion)} por 1M`,
})

export function groupModels(models: ModelOption[], current: string): Group[] {
  const known = models.length ? models.map((m) => m.id) : FALLBACK_MODELS.map((f) => f.id)
  const groups: Group[] = []
  if (current && !known.includes(current)) groups.push({ label: 'Escolhido', options: [{ id: current, label: current }] })

  if (!models.length) return [...groups, { label: 'Recomendados', options: FALLBACK_MODELS }]

  const byId = new Map(models.map((m) => [m.id, m]))
  groups.push({
    label: 'Recomendados',
    options: RECOMMENDED_MODELS.filter((id) => byId.has(id)).map((id) => optionOf(byId.get(id)!)),
  })
  const byProvider = new Map<string, ModelOption[]>()
  for (const m of models) byProvider.set(provider(m), [...(byProvider.get(provider(m)) ?? []), m])
  for (const [label, list] of [...byProvider].sort(([a], [b]) => a.localeCompare(b))) {
    groups.push({ label, options: list.map(optionOf) })
  }
  return groups
}
