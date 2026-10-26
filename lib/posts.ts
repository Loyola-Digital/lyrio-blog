import type { Row, Sql } from './db'
import { SOURCE_LOCALE, TARGET_LOCALES, type Locale } from './locales'
import { slugify } from './slug'
import type { Post, PostType, Version, VersionFields } from './types'

const NO_POST = '00000000-0000-0000-0000-000000000000' // post novo ainda sem id: nenhuma versão a ignorar
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const toPost = (r: Row): Post => ({
  id: r.id, type: r.type, topic: r.topic, coverUrl: r.cover_url, status: r.status, rev: r.rev,
  createdAt: r.created_at, updatedAt: r.updated_at, publishedAt: r.published_at,
})

const toVersion = (r: Row): Version => ({
  postId: r.post_id, locale: r.locale, rev: r.v_rev, slug: r.slug, title: r.title, headline: r.headline,
  summary: r.summary, bodyMd: r.body_md, faq: r.faq, metaDescription: r.meta_description, updatedAt: r.v_updated_at,
})

async function uniqueSlug(sql: Sql, locale: Locale, rawBase: string, postId: string): Promise<string> {
  const base = rawBase || 'artigo' // título só com símbolos não pode virar /pt-BR/
  const rows = await sql`select slug from post_versions
    where locale = ${locale} and post_id <> ${postId} and (slug = ${base} or slug like ${base + '-%'})`
  const taken = new Set(rows.map((r) => r.slug))
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
  return slug
}

async function upsertVersion(sql: Sql, postId: string, locale: Locale, rev: number, slug: string, f: VersionFields) {
  await sql`insert into post_versions (post_id, locale, rev, slug, title, headline, summary, body_md, faq, meta_description)
    values (${postId}, ${locale}, ${rev}, ${slug}, ${f.title}, ${f.headline}, ${f.summary}, ${f.bodyMd},
            ${JSON.stringify(f.faq)}::text::jsonb, ${f.metaDescription})
    on conflict (post_id, locale) do update set rev = excluded.rev, slug = excluded.slug, title = excluded.title,
      headline = excluded.headline, summary = excluded.summary, body_md = excluded.body_md, faq = excluded.faq,
      meta_description = excluded.meta_description, updated_at = now()
    where post_versions.rev <= excluded.rev` // tradução de um rev antigo que chega atrasada não apaga a mais nova
}

export async function createPost(
  sql: Sql,
  input: { type: PostType; topic?: string | null; coverUrl?: string | null; source: VersionFields },
): Promise<string> {
  const f = input.source
  const slug = await uniqueSlug(sql, SOURCE_LOCALE, f.slug || slugify(f.title), NO_POST)
  // post e versão pt-BR num comando só: ou entram os dois, ou nenhum
  const [{ id }] = await sql`with p as (
      insert into posts (type, topic, cover_url) values (${input.type}, ${input.topic ?? null}, ${input.coverUrl ?? null})
      returning id
    )
    insert into post_versions (post_id, locale, rev, slug, title, headline, summary, body_md, faq, meta_description)
    select p.id, ${SOURCE_LOCALE}, 0, ${slug}, ${f.title}, ${f.headline}, ${f.summary}, ${f.bodyMd},
      ${JSON.stringify(f.faq)}::text::jsonb, ${f.metaDescription}
    from p returning post_id as id`
  return id
}

export async function updateSource(
  sql: Sql,
  id: string,
  input: { type: PostType; coverUrl: string | null; source: VersionFields },
): Promise<void> {
  const [post] = await sql`update posts set type = ${input.type}, cover_url = ${input.coverUrl}, updated_at = now()
    where id = ${id} returning rev`
  const slug = await uniqueSlug(sql, SOURCE_LOCALE, input.source.slug || slugify(input.source.title), id)
  await upsertVersion(sql, id, SOURCE_LOCALE, post.rev, slug, input.source)
}

export async function publish(sql: Sql, id: string): Promise<{ rev: number }> {
  const [row] = await sql`update posts set status = 'published', rev = rev + 1,
    published_at = coalesce(published_at, now()), updated_at = now() where id = ${id} returning rev`
  await sql`update post_versions set rev = ${row.rev} where post_id = ${id} and locale = ${SOURCE_LOCALE}`
  return { rev: row.rev }
}

export async function unpublish(sql: Sql, id: string): Promise<void> {
  await sql`update posts set status = 'draft', updated_at = now() where id = ${id}`
}

export async function deletePost(sql: Sql, id: string): Promise<void> {
  await sql`delete from posts where id = ${id}`
}

export async function saveTranslation(
  sql: Sql, postId: string, locale: Locale, rev: number, fields: VersionFields,
): Promise<{ slug: string }> {
  const [existing] = await sql`select slug from post_versions where post_id = ${postId} and locale = ${locale}`
  const slug = existing?.slug ?? (await uniqueSlug(sql, locale, fields.slug || slugify(fields.title), postId))
  await upsertVersion(sql, postId, locale, rev, slug, fields)
  return { slug }
}

export async function missingLocales(sql: Sql, id: string): Promise<Locale[]> {
  const rows = await sql`select v.locale from post_versions v join posts p on p.id = v.post_id
    where v.post_id = ${id} and v.rev = p.rev`
  const done = new Set(rows.map((r) => r.locale))
  return TARGET_LOCALES.filter((l) => !done.has(l))
}

export async function getPostForEdit(sql: Sql, id: string): Promise<{ post: Post; source: Version } | null> {
  if (!UUID.test(id)) return null
  const [r] = await sql`select p.*, v.post_id, v.locale, v.rev as v_rev, v.slug, v.title, v.headline, v.summary,
      v.body_md, v.faq, v.meta_description, v.updated_at as v_updated_at
    from posts p join post_versions v on v.post_id = p.id and v.locale = ${SOURCE_LOCALE} where p.id = ${id}`
  return r ? { post: toPost(r), source: toVersion(r) } : null
}

export async function listAdminPosts(sql: Sql) {
  const rows = await sql`select p.id, p.type, p.status, p.updated_at, v.title,
      (select count(*)::int from post_versions t
        where t.post_id = p.id and t.locale <> ${SOURCE_LOCALE} and t.rev = p.rev) as translated
    from posts p join post_versions v on v.post_id = p.id and v.locale = ${SOURCE_LOCALE}
    order by p.updated_at desc`
  return rows.map((r) => ({
    id: r.id as string, type: r.type as PostType, status: r.status as Post['status'], title: r.title as string,
    translated: r.translated as number, updatedAt: r.updated_at as Date,
  }))
}

export async function getPublishedVersion(
  sql: Sql, locale: Locale, slug: string,
): Promise<{ post: Post; version: Version; alternates: { locale: Locale; slug: string }[] } | null> {
  const [r] = await sql`select p.*, v.post_id, v.locale, v.rev as v_rev, v.slug, v.title, v.headline, v.summary,
      v.body_md, v.faq, v.meta_description, v.updated_at as v_updated_at
    from post_versions v join posts p on p.id = v.post_id
    where v.locale = ${locale} and v.slug = ${slug} and p.status = 'published'`
  if (!r) return null
  return { post: toPost(r), version: toVersion(r), alternates: await listVersionsOf(sql, r.id) }
}

// Só o que as listagens mostram (home e "Leia também"), sem o texto inteiro.
export async function listPublished(sql: Sql, locale: Locale) {
  const rows = await sql`select p.type, p.cover_url, p.published_at, v.post_id, v.slug, v.title, v.headline, v.summary
    from post_versions v join posts p on p.id = v.post_id
    where v.locale = ${locale} and p.status = 'published' order by p.published_at desc`
  return rows.map((r) => ({
    postId: r.post_id as string, slug: r.slug as string, title: r.title as string, headline: r.headline as string,
    summary: r.summary as string, type: r.type as PostType, coverUrl: r.cover_url as string | null,
    publishedAt: r.published_at as Date,
  }))
}

export async function listVersionsOf(sql: Sql, postId: string): Promise<{ locale: Locale; slug: string }[]> {
  const rows = await sql`select locale, slug from post_versions where post_id = ${postId} order by locale`
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }))
}

export async function listAllPublishedVersions(sql: Sql) {
  const rows = await sql`select v.post_id, v.locale, v.slug, v.title, v.summary, v.updated_at
    from post_versions v join posts p on p.id = v.post_id
    where p.status = 'published' order by p.published_at desc, v.locale`
  return rows.map((r) => ({
    postId: r.post_id as string, locale: r.locale as Locale, slug: r.slug as string, title: r.title as string,
    summary: r.summary as string, updatedAt: r.updated_at as Date,
  }))
}
