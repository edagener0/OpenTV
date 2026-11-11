import { api } from './api'
import type { MediaType } from './tmdb'

export interface User {
  id: number
  username: string
  createdAt: number
}

export interface ServerInfo {
  name: string
  version: string
  tmdbConfigured: boolean
  registrationEnabled: boolean
}

export interface Favorite {
  mediaType: MediaType
  tmdbId: number
  title: string
  posterPath: string | null
  backdropPath: string | null
  voteAverage: number | null
  releaseDate: string | null
  createdAt: number
}

export interface ProgressEntry {
  mediaType: MediaType
  tmdbId: number
  season: number | null
  episode: number | null
  title: string
  episodeTitle: string | null
  posterPath: string | null
  backdropPath: string | null
  progress: number
  watchedSeconds: number
  completed: boolean
  provider: string | null
  updatedAt: number
}

export interface Stats {
  totalSeconds: number
  moviesWatched: number
  showsWatched: number
  episodesWatched: number
  completed: number
  favorites: { movies: number; shows: number }
  topGenres: { name: string; seconds: number }[]
  topTitles: {
    mediaType: MediaType
    tmdbId: number
    title: string
    posterPath: string | null
    seconds: number
  }[]
  activity: { day: string; seconds: number }[]
  streak: number
  memberSince: number
}

export interface HeartbeatPayload {
  mediaType: MediaType
  tmdbId: number
  season?: number
  episode?: number
  title: string
  episodeTitle?: string | null
  posterPath?: string | null
  backdropPath?: string | null
  genres?: string[]
  runtimeMinutes?: number | null
  seconds: number
  position?: number | null
  duration?: number | null
  provider?: string | null
}

export interface FavoritePayload {
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  voteAverage?: number | null
  releaseDate?: string | null
}

export const libraryKeys = {
  all: ['library'] as const,
  favorites: ['library', 'favorites'] as const,
  favorite: (mediaType: MediaType, tmdbId: number) =>
    ['library', 'favorites', mediaType, tmdbId] as const,
  continue: ['library', 'continue'] as const,
  history: ['library', 'history'] as const,
  title: (mediaType: MediaType, tmdbId: number) => ['library', 'title', mediaType, tmdbId] as const,
  stats: ['library', 'stats'] as const,
}

export const libraryApi = {
  serverInfo: () => api<ServerInfo>('/server-info'),
  me: () => api<{ user: User | null }>('/auth/me').then((body) => body.user),
  login: (username: string, password: string) =>
    api<{ user: User }>('/auth/login', { method: 'POST', body: { username, password } }),
  register: (username: string, password: string) =>
    api<{ user: User }>('/auth/register', { method: 'POST', body: { username, password } }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
  logoutAll: () => api<void>('/auth/logout-all', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<void>('/auth/password', { method: 'POST', body: { currentPassword, newPassword } }),
  deleteAccount: (password: string) =>
    api<void>('/auth/me', { method: 'DELETE', body: { password } }),
  favorites: () => api<{ items: Favorite[] }>('/library/favorites').then((body) => body.items),
  isFavorite: (mediaType: MediaType, tmdbId: number) =>
    api<{ favorite: boolean }>(`/library/favorites/${mediaType}/${tmdbId}`).then(
      (body) => body.favorite,
    ),
  addFavorite: (mediaType: MediaType, tmdbId: number, payload: FavoritePayload) =>
    api<{ item: Favorite }>(`/library/favorites/${mediaType}/${tmdbId}`, {
      method: 'PUT',
      body: payload,
    }),
  removeFavorite: (mediaType: MediaType, tmdbId: number) =>
    api<void>(`/library/favorites/${mediaType}/${tmdbId}`, { method: 'DELETE' }),
  continueWatching: () =>
    api<{ items: ProgressEntry[] }>('/library/continue').then((body) => body.items),
  history: (limit = 100, offset = 0) =>
    api<{ items: ProgressEntry[] }>(`/library/history?limit=${limit}&offset=${offset}`).then(
      (body) => body.items,
    ),
  titleProgress: (mediaType: MediaType, tmdbId: number) =>
    api<{ items: ProgressEntry[] }>(`/library/history/${mediaType}/${tmdbId}`).then(
      (body) => body.items,
    ),
  heartbeat: (payload: HeartbeatPayload) =>
    api<{ item: ProgressEntry }>('/library/history/heartbeat', { method: 'POST', body: payload }),
  removeTitle: (mediaType: MediaType, tmdbId: number) =>
    api<void>(`/library/history/${mediaType}/${tmdbId}`, { method: 'DELETE' }),
  clearHistory: () => api<void>('/library/history', { method: 'DELETE' }),
  stats: () => api<Stats>('/library/stats'),
}
