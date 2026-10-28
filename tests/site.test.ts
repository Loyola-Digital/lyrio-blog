import { describe, expect, it } from 'vitest'
import { asset, blogHref } from '@/lib/site'

describe('blogHref', () => {
  it('monta os caminhos do blog em /{idioma}/blog/, com barra no fim como o lyrioapp.com', () => {
    expect(blogHref('pt-BR')).toBe('/pt-BR/blog/')
    expect(blogHref('pt-BR', 'recai-e-agora')).toBe('/pt-BR/blog/recai-e-agora/')
    expect(blogHref('ja', '如何')).toBe(`/ja/blog/${encodeURIComponent('如何')}/`)
  })

  it('serve imagens do public pelo prefixo do blog (o resto do domínio é do site principal)', () => {
    expect(asset('/logo.webp')).toBe('/blog-static/logo.webp')
  })
})
