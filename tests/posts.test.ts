import { beforeEach, describe, expect, it } from 'vitest'
import type { Sql } from '@/lib/db'
import {
  createPost, deletePost, getPostForEdit, getPublishedVersion, listAdminPosts, listAllPublishedVersions,
  listPublished, listVersionsOf, missingLocales, publish, saveTranslation, unpublish, updateSource,
} from '@/lib/posts'
import { src, testSql } from './helpers/db'

let sql: Sql
beforeEach(async () => { sql = await testSql() })

describe('posts', () => {
  it('cria rascunho com versão pt-BR', async () => {
    const id = await createPost(sql, { type: 'faq', topic: 't', source: src() })
    const e = await getPostForEdit(sql, id)
    expect(e!.post).toMatchObject({ status: 'draft', rev: 0, type: 'faq', topic: 't', coverUrl: null })
    expect(e!.source).toMatchObject({ locale: 'pt-BR', slug: 'como-parar', faq: [] })
  })

  it('devolve null para id inexistente ou inválido', async () => {
    expect(await getPostForEdit(sql, crypto.randomUUID())).toBeNull()
    expect(await getPostForEdit(sql, 'novo')).toBeNull()
  })

  it('slug repetido no mesmo idioma ganha -2; re-salvar o mesmo post mantém', async () => {
    const a = await createPost(sql, { type: 'artigo', source: src() })
    const b = await createPost(sql, { type: 'artigo', source: src() })
    expect((await getPostForEdit(sql, b))!.source.slug).toBe('como-parar-2')
    await updateSource(sql, a, { type: 'artigo', coverUrl: null, source: src({ title: 'Novo' }) })
    expect((await getPostForEdit(sql, a))!.source).toMatchObject({ slug: 'como-parar', title: 'Novo' })
  })

  it('título sem letras nunca gera slug vazio', async () => {
    const id = await createPost(sql, { type: 'artigo', source: src({ slug: '', title: '!!!' }) })
    expect((await getPostForEdit(sql, id))!.source.slug).toBe('artigo')
    await publish(sql, id)
    expect(await saveTranslation(sql, id, 'de', 1, src({ slug: '', title: '…' }))).toEqual({ slug: 'artigo' })
  })

  it('listagem não carrega o texto inteiro', async () => {
    const id = await createPost(sql, { type: 'artigo', source: src() })
    await publish(sql, id)
    const [row] = await listPublished(sql, 'pt-BR')
    expect(row).toMatchObject({ postId: id, slug: 'como-parar', title: 'Como parar', summary: 's', type: 'artigo' })
    expect(row).not.toHaveProperty('bodyMd')
  })

  it('publish incrementa rev e fixa published_at só na primeira vez', async () => {
    const id = await createPost(sql, { type: 'artigo', source: src() })
    expect(await publish(sql, id)).toEqual({ rev: 1 })
    const first = (await getPostForEdit(sql, id))!.post.publishedAt
    expect(first).toBeInstanceOf(Date)
    expect(await publish(sql, id)).toEqual({ rev: 2 })
    expect((await getPostForEdit(sql, id))!.post.publishedAt).toEqual(first)
  })

  it('traduções de rev antigo contam como faltantes; slug existente é mantido', async () => {
    const id = await createPost(sql, { type: 'artigo', source: src() })
    await publish(sql, id)
    expect(await missingLocales(sql, id)).toHaveLength(41)
    expect(await saveTranslation(sql, id, 'de', 1, src({ slug: 'wie-aufhoeren' }))).toEqual({ slug: 'wie-aufhoeren' })
    expect(await missingLocales(sql, id)).not.toContain('de')
    await publish(sql, id)
    expect(await missingLocales(sql, id)).toContain('de')
    expect(await saveTranslation(sql, id, 'de', 2, src({ slug: 'outro-slug' }))).toEqual({ slug: 'wie-aufhoeren' })
    expect((await listAdminPosts(sql))[0]).toMatchObject({ id, translated: 1, title: 'Como parar', status: 'published' })
  })

  it('tradução de rev antigo que chega atrasada não sobrescreve a mais nova', async () => {
    const id = await createPost(sql, { type: 'artigo', source: src() })
    await publish(sql, id)
    await publish(sql, id)
    await saveTranslation(sql, id, 'de', 2, src({ slug: 'neu', title: 'Neu' }))
    await saveTranslation(sql, id, 'de', 1, src({ slug: 'alt', title: 'Alt' }))
    expect(await missingLocales(sql, id)).not.toContain('de')
    expect((await getPublishedVersion(sql, 'de', 'neu'))!.version).toMatchObject({ title: 'Neu', rev: 2 })
  })

  it('público só vê publicados, com alternates', async () => {
    const id = await createPost(sql, { type: 'artigo', source: src() })
    expect(await getPublishedVersion(sql, 'pt-BR', 'como-parar')).toBeNull()
    await publish(sql, id)
    await saveTranslation(sql, id, 'ja', 1, src({ slug: '如何' }))
    const r = await getPublishedVersion(sql, 'ja', '如何')
    expect(r!.version).toMatchObject({ locale: 'ja', slug: '如何', postId: id })
    expect(r!.alternates.map((a) => a.locale).sort()).toEqual(['ja', 'pt-BR'])
    expect(await listPublished(sql, 'ja')).toHaveLength(1)
    expect(await listAllPublishedVersions(sql)).toHaveLength(2)
    await unpublish(sql, id)
    expect(await listPublished(sql, 'ja')).toHaveLength(0)
    expect(await getPublishedVersion(sql, 'ja', '如何')).toBeNull()
  })

  it('deletePost remove as versões', async () => {
    const id = await createPost(sql, { type: 'artigo', source: src() })
    await deletePost(sql, id)
    expect(await getPostForEdit(sql, id)).toBeNull()
    expect(await listVersionsOf(sql, id)).toEqual([])
  })
})
