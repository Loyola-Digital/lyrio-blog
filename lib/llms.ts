type Section = { heading: string; items: { title: string; url: string; summary: string }[] }

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

export function buildLlmsTxt(about: string, sections: Section[]): string {
  const [first = '', ...rest] = about.trim().split(/\n\s*\n/)
  let out = '# Lyrio\n\n'
  if (first) out += `> ${oneLine(first)}\n\n`
  if (rest.length) out += rest.join('\n\n') + '\n\n'
  for (const s of sections) {
    if (!s.items.length) continue
    out += `## ${s.heading}\n\n` + s.items.map((i) => `- [${oneLine(i.title)}](${i.url}): ${oneLine(i.summary)}`).join('\n') + '\n\n'
  }
  return out.trimEnd() + '\n'
}
