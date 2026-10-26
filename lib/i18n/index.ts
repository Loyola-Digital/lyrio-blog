import type { Locale } from '../locales'
import { ptBR, type UiStrings } from './pt-BR'
import ui from './ui.json'

const TABLE = ui as Record<string, Partial<UiStrings>>

export function t(locale: Locale): UiStrings {
  return { ...ptBR, ...TABLE[locale] }
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}
