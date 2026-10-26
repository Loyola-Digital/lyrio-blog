import type { Sql } from './db'

export async function getAbout(sql: Sql): Promise<string> {
  const [row] = await sql`select value from settings where key = 'about'`
  return row?.value ?? ''
}

export async function setAbout(sql: Sql, text: string): Promise<void> {
  await sql`insert into settings (key, value) values ('about', ${text})
    on conflict (key) do update set value = excluded.value`
}
