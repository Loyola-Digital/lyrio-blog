import { describe, expect, it } from 'vitest'
import { articleJsonLd, jsonLdString, siteJsonLd } from '@/lib/jsonld'
import { buildLlmsTxt } from '@/lib/llms'
import { extractSteps, readingMinutes, renderMarkdown } from '@/lib/markdown'
import { pathsFor } from '@/lib/revalidate'
import type { Post, Version } from '@/lib/types'

describe('markdown', () => {
  it('escapa HTML cru', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toContain('&lt;script&gt;')
    expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>')
  })

  it('não troca aspas e traços (cada idioma tem as suas)', () => {
    expect(renderMarkdown('"oi" -- (c)')).toContain('&quot;oi&quot; -- (c)')
  })

  it('renderiza subtítulos', () => {
    expect(renderMarkdown('## Por quê?')).toContain('<h2>Por quê?</h2>')
  })

  it('extrai passos da primeira lista numerada', () => {
    expect(extractSteps('Intro\n\n1. **Saia do lugar.** Levante da cama.\n2. **Abra o Socorro.** Toque.\n')).toEqual([
      { name: 'Saia do lugar', text: 'Levante da cama.' },
      { name: 'Abra o Socorro', text: 'Toque.' },
    ])
    expect(extractSteps('1. Sem negrito aqui. Resto.')).toEqual([{ name: 'Sem negrito aqui', text: 'Resto.' }])
    expect(extractSteps('- item\n- item')).toEqual([])
  })

  it('estima o tempo de leitura, inclusive em CJK', () => {
    expect(readingMinutes('palavra '.repeat(440))).toBe(2)
    expect(readingMinutes('')).toBe(1)
    expect(readingMinutes('字'.repeat(880))).toBe(2)
  })
})

const U = 'https://blog.lyrioapp.com/pt-BR/como-usar-o-socorro'
const H = 'https://blog.lyrioapp.com/pt-BR'
const post: Post = {
  id: 'p1', type: 'tutorial', topic: null, coverUrl: null, status: 'published', rev: 1,
  createdAt: new Date('2026-10-01T10:00:00Z'), updatedAt: new Date('2026-10-02T10:00:00Z'),
  publishedAt: new Date('2026-10-02T10:00:00Z'),
}
const version: Version = {
  postId: 'p1', locale: 'pt-BR', rev: 1, slug: 'como-usar-o-socorro', title: 'Como usar o Socorro',
  headline: 'h', summary: 's', bodyMd: '1. **Saia.** Agora.\n2. **Abra.** O app.', faq: [{ q: 'q1', a: 'a1' }],
  metaDescription: 'md', updatedAt: new Date('2026-10-03T10:00:00Z'),
}

describe('json-ld', () => {
  it('monta artigo, breadcrumb, FAQ e HowTo', () => {
    const [blog, crumbs, faq, howto] = articleJsonLd({ post, version, url: U, homeUrl: H, homeName: 'Artigos' }) as any[]
    expect(blog).toMatchObject({
      '@type': 'BlogPosting', headline: version.title, inLanguage: 'pt-BR',
      author: { '@type': 'Organization', name: 'Lyrio' }, publisher: { name: 'Lyrio' }, mainEntityOfPage: U,
      description: 'md', datePublished: post.publishedAt!.toISOString(), dateModified: version.updatedAt.toISOString(),
    })
    expect(blog.publisher.logo.url).toMatch(/\/logo\.png$/)
    expect(crumbs['@type']).toBe('BreadcrumbList')
    expect(crumbs.itemListElement).toHaveLength(2)
    expect(faq).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'q1', acceptedAnswer: { '@type': 'Answer', text: 'a1' } }],
    })
    expect(howto['@type']).toBe('HowTo')
    expect(howto.step).toHaveLength(2)
    expect(howto.step[0]).toMatchObject({ '@type': 'HowToStep', position: 1, name: 'Saia', text: 'Agora.' })
  })

  it('sem FAQ e fora de tutorial, só artigo e breadcrumb', () => {
    const types = articleJsonLd({
      post: { ...post, type: 'artigo' }, version: { ...version, faq: [] }, url: U, homeUrl: H, homeName: 'Artigos',
    }).map((x: any) => x['@type'])
    expect(types).toEqual(['BlogPosting', 'BreadcrumbList'])
  })

  it('descreve a organização e o app', () => {
    const site = siteJsonLd() as any[]
    expect(site.find((x) => x['@type'] === 'Organization')).toMatchObject({ name: 'Lyrio', url: 'https://lyrioapp.com' })
    expect(JSON.stringify(site)).toContain('id6760236148')
    expect(JSON.stringify(site)).toContain('app.rork.lyrio')
    expect(site.find((x) => x['@type'] === 'MobileApplication')).toMatchObject({ name: 'Lyrio', operatingSystem: 'iOS, Android' })
    const blog = articleJsonLd({ post, version, url: U, homeUrl: H, homeName: 'Artigos' })
    expect(JSON.stringify([site, blog])).not.toContain('Blessed Byte')
  })

  it('não deixa conteúdo fechar a tag script', () => {
    expect(jsonLdString({ a: '</script><b>' })).not.toContain('</script>')
  })
})

describe('llms.txt', () => {
  it('segue o formato do llms.txt', () => {
    const out = buildLlmsTxt('Lyrio ajuda a sair do vício.\n\nFunções: Socorro.', [
      { heading: 'Artigos (Português)', items: [{ title: 'T', url: 'https://blog.lyrioapp.com/pt-BR/t', summary: 'S' }] },
    ])
    expect(out).toBe(
      '# Lyrio\n\n> Lyrio ajuda a sair do vício.\n\nFunções: Socorro.\n\n## Artigos (Português)\n\n- [T](https://blog.lyrioapp.com/pt-BR/t): S\n',
    )
  })
})

describe('pathsFor', () => {
  it('lista as páginas a revalidar sem repetir', () => {
    expect(pathsFor([{ locale: 'ja', slug: '如何' }, { locale: 'ja', slug: 'x' }])).toEqual([
      '/ja', `/ja/${encodeURIComponent('如何')}`, '/ja/x', '/sitemap.xml', '/llms.txt',
    ])
  })
})
