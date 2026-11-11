import { api } from './api'

export type MediaType = 'movie' | 'tv'

export interface Genre {
  id: number
  name: string
}

export interface MediaSummary {
  id: number
  media_type?: MediaType | 'person'
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average?: number
  vote_count?: number
  release_date?: string
  first_air_date?: string
  genre_ids?: number[]
  popularity?: number
  original_language?: string
}

export interface Paged<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface CastMember {
  id: number
  name: string
  character?: string
  profile_path: string | null
  roles?: { character: string }[]
}

export interface Video {
  key: string
  site: string
  type: string
  name: string
  official?: boolean
}

export interface SeasonSummary {
  id: number
  season_number: number
  name: string
  episode_count: number
  poster_path: string | null
  air_date: string | null
}

export interface Episode {
  id: number
  episode_number: number
  season_number: number
  name: string
  overview: string
  still_path: string | null
  air_date: string | null
  runtime: number | null
  vote_average: number
}

export interface SeasonDetails {
  id: number
  season_number: number
  name: string
  overview: string
  episodes: Episode[]
}

export interface MediaDetails extends MediaSummary {
  genres: Genre[]
  runtime?: number | null
  episode_run_time?: number[]
  tagline?: string
  status?: string
  number_of_seasons?: number
  number_of_episodes?: number
  seasons?: SeasonSummary[]
  last_episode_to_air?: Episode | null
  next_episode_to_air?: Episode | null
  external_ids?: { imdb_id?: string | null }
  credits?: { cast: CastMember[] }
  aggregate_credits?: { cast: CastMember[] }
  videos?: { results: Video[] }
  recommendations?: Paged<MediaSummary>
  similar?: Paged<MediaSummary>
  production_companies?: { id: number; name: string }[]
  networks?: { id: number; name: string }[]
  spoken_languages?: { english_name: string }[]
}

export type ImageSize = 'w92' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original'

export function imageUrl(path: string | null | undefined, size: ImageSize): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}

export function titleOf(item: MediaSummary): string {
  return item.title ?? item.name ?? item.original_title ?? item.original_name ?? 'Untitled'
}

export function dateOf(item: MediaSummary): string | undefined {
  return item.release_date || item.first_air_date || undefined
}

export function yearOf(item: MediaSummary): string | undefined {
  return dateOf(item)?.slice(0, 4) || undefined
}

export function mediaTypeOf(item: MediaSummary, fallback: MediaType = 'movie'): MediaType {
  if (item.media_type === 'movie' || item.media_type === 'tv') return item.media_type
  if (item.first_air_date !== undefined || item.name !== undefined) return 'tv'
  return fallback
}

export function isPlayable(item: MediaSummary): boolean {
  return item.media_type !== 'person'
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export function tmdb<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  signal?: AbortSignal,
): Promise<T> {
  return api<T>(`/tmdb/${path}${query(params)}`, signal ? { signal } : {})
}

export const tmdbKeys = {
  list: (path: string, params: Record<string, string | number | undefined> = {}) =>
    ['tmdb', path, params] as const,
}

export const DETAILS_APPEND: Record<MediaType, string> = {
  movie: 'credits,videos,recommendations,similar,external_ids',
  tv: 'aggregate_credits,videos,recommendations,similar,external_ids',
}

export const SORT_OPTIONS: Record<MediaType, { value: string; label: string }[]> = {
  movie: [
    { value: 'popularity.desc', label: 'Most popular' },
    { value: 'vote_average.desc', label: 'Highest rated' },
    { value: 'primary_release_date.desc', label: 'Newest' },
    { value: 'revenue.desc', label: 'Box office' },
  ],
  tv: [
    { value: 'popularity.desc', label: 'Most popular' },
    { value: 'vote_average.desc', label: 'Highest rated' },
    { value: 'first_air_date.desc', label: 'Newest' },
  ],
}

export function pickTrailer(videos: Video[] | undefined): Video | undefined {
  if (!videos) return undefined
  const youtube = videos.filter((video) => video.site === 'YouTube')
  return (
    youtube.find((video) => video.type === 'Trailer' && video.official) ??
    youtube.find((video) => video.type === 'Trailer') ??
    youtube.find((video) => video.type === 'Teaser') ??
    youtube[0]
  )
}

export function playableSeasons(seasons: SeasonSummary[] | undefined): SeasonSummary[] {
  const list = (seasons ?? []).filter((season) => season.episode_count > 0)
  const regular = list.filter((season) => season.season_number > 0)
  return regular.length > 0
    ? [...regular, ...list.filter((season) => season.season_number === 0)]
    : list
}

export function pickSeason(seasons: SeasonSummary[], requested: string | null): number {
  const first = seasons[0]?.season_number ?? 1
  if (requested === null || requested.trim() === '') return first
  const value = Number(requested)
  return seasons.some((season) => season.season_number === value) ? value : first
}

export function dedupe(items: MediaSummary[]): MediaSummary[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.media_type ?? ''}-${item.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
