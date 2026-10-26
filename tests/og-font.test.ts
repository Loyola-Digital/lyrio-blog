import { describe, expect, it } from 'vitest'
import { ogFonts } from '@/lib/og-font'

describe('ogFonts', () => {
  it('sem fonte baixada, deixa o ImageResponse usar a fonte padrão', () => {
    // [] é truthy: o @vercel/og não cai na fonte padrão e o satori quebra
    expect(ogFonts(null)).toBeUndefined()
  })

  it('com fonte, registra como Serif', () => {
    const data = new ArrayBuffer(4)
    expect(ogFonts(data)).toEqual([{ name: 'Serif', data, weight: 500, style: 'normal' }])
  })
})
