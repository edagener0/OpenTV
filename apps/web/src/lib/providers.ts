import type { MediaType } from './tmdb'

export interface Provider {
  id: string
  name: string
  movie: string
  tv: string
  recommended?: boolean
  language?: string
}

export interface EmbedTarget {
  mediaType: MediaType
  tmdbId: number
  season?: number
  episode?: number
}

export function buildEmbedUrl(provider: Provider, target: EmbedTarget): string {
  const template = target.mediaType === 'movie' ? provider.movie : provider.tv
  const values: Record<string, string> = {
    id: String(target.tmdbId),
    season: String(target.season ?? 1),
    episode: String(target.episode ?? 1),
  }
  return template.replace(/\{(id|season|episode)\}/g, (_match, key: string) =>
    encodeURIComponent(values[key] ?? ''),
  )
}

export function originOf(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export interface PlayerProgress {
  position: number
  duration: number
}

function numberFrom(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function search(value: unknown, depth: number): PlayerProgress | null {
  if (depth > 3 || value === null || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const position = numberFrom(
    record.currentTime ?? record.timestamp ?? record.time ?? record.position,
  )
  const duration = numberFrom(record.duration)
  if (position !== null && duration !== null && duration > 0 && position >= 0) {
    return { position: Math.min(position, duration), duration }
  }
  for (const nested of Object.values(record)) {
    const found = search(nested, depth + 1)
    if (found) return found
  }
  return null
}

export function parsePlayerMessage(data: unknown): PlayerProgress | null {
  if (typeof data === 'string') {
    if (data.length > 10_000) return null
    try {
      return search(JSON.parse(data) as unknown, 0)
    } catch {
      return null
    }
  }
  return search(data, 0)
}
