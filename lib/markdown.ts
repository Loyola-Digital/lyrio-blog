import MarkdownIt from 'markdown-it'

// html: false — corpo vem da IA e do admin; HTML cru é escapado
// typographer desligado: ele põe aspas inglesas em todos os idiomas (alemão usa „“, francês « »)
const md = new MarkdownIt({ html: false, linkify: true, typographer: false })

export function renderMarkdown(src: string): string {
  return md.render(src)
}

export function extractSteps(src: string): { name: string; text: string }[] {
  const tokens = md.parse(src, {})
  const start = tokens.findIndex((t) => t.type === 'ordered_list_open')
  if (start < 0) return []
  const itemLevel = tokens[start].level + 1
  const steps: { name: string; text: string }[] = []
  let wantInline = false
  for (let i = start + 1; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type === 'ordered_list_close' && t.level === tokens[start].level) break
    if (t.type === 'list_item_open' && t.level === itemLevel) wantInline = true
    else if (t.type === 'inline' && wantInline) {
      steps.push(splitStep(t.content))
      wantInline = false
    }
  }
  return steps
}

function splitStep(content: string): { name: string; text: string } {
  const bold = content.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/)
  const sentence = content.match(/^(.+?[.!?])\s+([\s\S]*)$/)
  const [name, text] = bold ? [bold[1], bold[2]] : sentence ? [sentence[1], sentence[2]] : [content, '']
  return { name: name.trim().replace(/[.]$/, ''), text: text.trim() }
}

const CJK = /[぀-ヿ㐀-鿿豈-﫿]/g

export function readingMinutes(...parts: string[]): number {
  const text = parts.join(' ')
  const cjk = text.match(CJK)?.length ?? 0
  const words = text.replace(CJK, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round((words + cjk / 2) / 220))
}
