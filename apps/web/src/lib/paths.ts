import type { ProgressEntry } from './library'
import type { MediaType } from './tmdb'

export function watchPath(mediaType: MediaType, id: number): string {
  return mediaType === 'tv' ? `/watch/tv/${id}/1/1` : `/watch/movie/${id}`
}

export function progressWatchPath(entry: ProgressEntry): string {
  return entry.mediaType === 'tv'
    ? `/watch/tv/${entry.tmdbId}/${entry.season ?? 1}/${entry.episode ?? 1}`
    : `/watch/movie/${entry.tmdbId}`
}
