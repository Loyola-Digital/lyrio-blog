// Grava content/sobre-o-lyrio.md como "Sobre o Lyrio", só se ainda estiver vazio. npm run seed:about
import { readFileSync } from 'node:fs'
import { getSql } from '@/lib/db'
import { getAbout, setAbout } from '@/lib/settings'

async function main() {
  const sql = getSql()
  if ((await getAbout(sql)).trim()) {
    console.log('"Sobre o Lyrio" já preenchido; nada feito.')
  } else {
    await setAbout(sql, readFileSync('content/sobre-o-lyrio.md', 'utf8').trim())
    console.log('"Sobre o Lyrio" gravado. Revise no admin antes de gerar artigos.')
  }
  process.exit(0)
}

main()
