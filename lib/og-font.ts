// Baixa só os glifos usados no texto (parâmetro text= do Google Fonts) — resolve CJK e devanágari sem pesar.
export async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@500&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
  if (!src) throw new Error(`Fonte não encontrada: ${family}`)
  return (await fetch(src)).arrayBuffer()
}

// undefined (e não []) faz o ImageResponse cair na fonte padrão quando o download falha.
export function ogFonts(font: ArrayBuffer | null) {
  return font ? [{ name: 'Serif', data: font, weight: 500 as const, style: 'normal' as const }] : undefined
}
