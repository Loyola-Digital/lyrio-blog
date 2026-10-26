import type { Locale } from '@/lib/locales'

// Uma tradução = uma chamada à API (cada uma cabe no tempo de uma função da Vercel).
export async function requestTranslation(postId: string, locale: Locale, model: string): Promise<void> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, locale, model }),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`)
}
