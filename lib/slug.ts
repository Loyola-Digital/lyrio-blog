const MAX = 80

export function slugify(s: string): string {
  const base = s
    .normalize('NFD')
    .replace(/([A-Za-z])[̀-ͯ]+/g, '$1') // só letra latina perde acento
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .split('-')
    // filtros de DNS de escolas e empresas bloqueiam URLs com "porn" ou "xxx"
    .filter((w) => w && !/porn|xxx/.test(w))
    .join('-')
  return Array.from(base).slice(0, MAX).join('').replace(/-+$/, '')
}

export function normalizeSlugParam(raw: string): string {
  try {
    return decodeURIComponent(raw).normalize('NFC')
  } catch {
    return raw
  }
}
