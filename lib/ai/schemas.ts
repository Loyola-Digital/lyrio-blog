import { z } from 'zod'

export const DraftSchema = z.strictObject({
  title: z.string(),
  headline: z.string(),
  summary: z.string(),
  body_md: z.string(),
  faq: z.array(z.strictObject({ q: z.string(), a: z.string() })),
  slug: z.string(),
  meta_description: z.string(),
})
export type Draft = z.infer<typeof DraftSchema>

export const GlossarySchema = z.strictObject({
  terms: z.array(z.strictObject({ source: z.string(), target: z.string() })),
})
