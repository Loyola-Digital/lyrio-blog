import type { Sql } from './db'
import type { Locale } from './locales'

export async function getAbout(sql: Sql): Promise<string> {
  const [row] = await sql`select value from settings where key = 'about'`
  return row?.value ?? ''
}

export async function setAbout(sql: Sql, text: string): Promise<void> {
  await sql`insert into settings (key, value) values ('about', ${text})
    on conflict (key) do update set value = excluded.value`
}

export async function getGlossary(sql: Sql, locale: Locale): Promise<Record<string, string> | null> {
  const [row] = await sql`select terms from glossary where locale = ${locale}`
  return row?.terms ?? null
}

export async function setGlossary(sql: Sql, locale: Locale, map: Record<string, string>): Promise<void> {
  if (!Object.keys(map).length) {
    await sql`delete from glossary where locale = ${locale}` // vazio: a IA gera de novo na próxima tradução
    return
  }
  await sql`insert into glossary (locale, terms) values (${locale}, ${JSON.stringify(map)}::text::jsonb)
    on conflict (locale) do update set terms = excluded.terms`
}
