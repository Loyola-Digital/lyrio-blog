import Link from 'next/link'
import { formatGlossaryText } from '@/lib/ai/translate'
import { getSql } from '@/lib/db'
import { ENGLISH_NAME, isLocale, NATIVE_NAME, TARGET_LOCALES } from '@/lib/locales'
import { getAbout, getGlossary } from '@/lib/settings'
import { requireAdmin } from '../guard'
import { AboutForm, GlossaryForm } from './forms'

export default async function SobrePage(props: { searchParams: Promise<{ idioma?: string }> }) {
  await requireAdmin()
  const { idioma } = await props.searchParams
  const locale = idioma && isLocale(idioma) && idioma !== 'pt-BR' ? idioma : 'en'
  const sql = getSql()
  const [about, glossary] = await Promise.all([getAbout(sql), getGlossary(sql, locale)])

  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1>Sobre o Lyrio</h1>
        <nav><Link href="/admin">← Artigos</Link></nav>
      </header>
      <div className="adm-split">
        <section className="adm-panel">
          <h2>O que a IA sabe sobre o app</h2>
          <p className="hint">
            É a única fonte que a IA usa sobre o Lyrio ao escrever, e o resumo que vai no /llms.txt.
            Descreva só o que o app faz de verdade.
          </p>
          <AboutForm about={about} />
        </section>
        <section className="adm-panel">
          <h2>Glossário</h2>
          <p className="hint">
            Nome de cada função do app em cada idioma, usado em todas as traduções. A IA gera sozinha na primeira tradução;
            aqui dá para trocar pelos textos oficiais do app.
          </p>
          <form method="get" className="ed-inline">
            <select name="idioma" defaultValue={locale} aria-label="Idioma">
              {TARGET_LOCALES.map((l) => <option key={l} value={l}>{NATIVE_NAME[l]} · {ENGLISH_NAME[l]}</option>)}
            </select>
            <button className="btn ghost">Abrir</button>
          </form>
          <GlossaryForm key={locale} locale={locale} text={glossary ? formatGlossaryText(glossary) : ''} />
        </section>
      </div>
    </main>
  )
}
