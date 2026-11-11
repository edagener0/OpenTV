import { readFileSync } from 'node:fs'
import { z } from 'zod'

const templateSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), 'Provider URLs must use https')
  .refine((value) => value.includes('{id}'), 'Provider URLs must contain the {id} placeholder')

const providerSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(40),
  movie: templateSchema,
  tv: templateSchema,
  recommended: z.boolean().optional(),
  language: z.string().max(30).optional(),
})

const providersFileSchema = z.object({
  providers: z.array(providerSchema).min(1),
})

export type Provider = z.infer<typeof providerSchema>

export function loadProviders(file: string): Provider[] {
  const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))
  const parsed = providersFileSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(`Invalid providers file ${file}: ${issue?.path.join('.')} ${issue?.message}`)
  }
  const seen = new Set<string>()
  for (const provider of parsed.data.providers) {
    if (seen.has(provider.id)) throw new Error(`Duplicate provider id "${provider.id}" in ${file}`)
    seen.add(provider.id)
  }
  return parsed.data.providers
}

export function providerOrigins(providers: Provider[]): string[] {
  const origins = new Set<string>()
  for (const provider of providers) {
    origins.add(new URL(provider.movie.replaceAll(/[{}]/g, '')).origin)
    origins.add(new URL(provider.tv.replaceAll(/[{}]/g, '')).origin)
  }
  return [...origins]
}
