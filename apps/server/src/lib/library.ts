import type { DB } from '../db.js'

export type MediaType = 'movie' | 'tv'

export interface FavoriteInput {
  mediaType: MediaType
  tmdbId: number
  title: string
  posterPath?: string | null | undefined
  backdropPath?: string | null | undefined
  voteAverage?: number | null | undefined
  releaseDate?: string | null | undefined
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

export interface HeartbeatInput {
  mediaType: MediaType
  tmdbId: number
  season?: number | undefined
  episode?: number | undefined
  title: string
  episodeTitle?: string | null | undefined
  posterPath?: string | null | undefined
  backdropPath?: string | null | undefined
  genres?: string[] | undefined
  runtimeMinutes?: number | null | undefined
  seconds: number
  position?: number | null | undefined
  duration?: number | null | undefined
  provider?: string | null | undefined
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

interface FavoriteRow {
  media_type: MediaType
  tmdb_id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number | null
  release_date: string | null
  created_at: number
}

interface ProgressRow {
  media_type: MediaType
  tmdb_id: number
  season: number
  episode: number
  title: string
  episode_title: string | null
  poster_path: string | null
  backdrop_path: string | null
  genres: string
  runtime_seconds: number | null
  position_seconds: number | null
  duration_seconds: number | null
  watched_seconds: number
  provider: string | null
  completed: number
  updated_at: number
}

const COMPLETION_THRESHOLD = 0.9
const DAY_MS = 24 * 60 * 60 * 1000

function toFavorite(row: FavoriteRow): Favorite {
  return {
    mediaType: row.media_type,
    tmdbId: row.tmdb_id,
    title: row.title,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    voteAverage: row.vote_average,
    releaseDate: row.release_date,
    createdAt: row.created_at,
  }
}

function computeProgress(row: ProgressRow): number {
  if (row.position_seconds && row.duration_seconds && row.duration_seconds > 0) {
    return Math.min(1, row.position_seconds / row.duration_seconds)
  }
  if (row.runtime_seconds && row.runtime_seconds > 0) {
    return Math.min(1, row.watched_seconds / row.runtime_seconds)
  }
  return 0
}

function toProgress(row: ProgressRow): ProgressEntry {
  return {
    mediaType: row.media_type,
    tmdbId: row.tmdb_id,
    season: row.media_type === 'tv' ? row.season : null,
    episode: row.media_type === 'tv' ? row.episode : null,
    title: row.title,
    episodeTitle: row.episode_title,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    progress: computeProgress(row),
    watchedSeconds: row.watched_seconds,
    completed: row.completed === 1,
    provider: row.provider,
    updatedAt: row.updated_at,
  }
}

export function utcDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export class LibraryService {
  constructor(private readonly db: DB) {}

  listFavorites(userId: number): Favorite[] {
    const rows = this.db
      .prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as FavoriteRow[]
    return rows.map(toFavorite)
  }

  addFavorite(userId: number, input: FavoriteInput): Favorite {
    const createdAt = Date.now()
    this.db
      .prepare(
        `INSERT INTO favorites
          (user_id, media_type, tmdb_id, title, poster_path, backdrop_path, vote_average, release_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id, media_type, tmdb_id) DO UPDATE SET
           title = excluded.title,
           poster_path = excluded.poster_path,
           backdrop_path = excluded.backdrop_path,
           vote_average = excluded.vote_average,
           release_date = excluded.release_date`,
      )
      .run(
        userId,
        input.mediaType,
        input.tmdbId,
        input.title,
        input.posterPath ?? null,
        input.backdropPath ?? null,
        input.voteAverage ?? null,
        input.releaseDate ?? null,
        createdAt,
      )
    const row = this.db
      .prepare('SELECT * FROM favorites WHERE user_id = ? AND media_type = ? AND tmdb_id = ?')
      .get(userId, input.mediaType, input.tmdbId) as FavoriteRow
    return toFavorite(row)
  }

  removeFavorite(userId: number, mediaType: MediaType, tmdbId: number): boolean {
    const result = this.db
      .prepare('DELETE FROM favorites WHERE user_id = ? AND media_type = ? AND tmdb_id = ?')
      .run(userId, mediaType, tmdbId)
    return result.changes > 0
  }

  isFavorite(userId: number, mediaType: MediaType, tmdbId: number): boolean {
    return Boolean(
      this.db
        .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND media_type = ? AND tmdb_id = ?')
        .get(userId, mediaType, tmdbId),
    )
  }

  recordHeartbeat(userId: number, input: HeartbeatInput, now = Date.now()): ProgressEntry {
    const season = input.mediaType === 'tv' ? (input.season ?? 1) : 0
    const episode = input.mediaType === 'tv' ? (input.episode ?? 1) : 0
    const runtimeSeconds = input.runtimeMinutes ? Math.round(input.runtimeMinutes * 60) : null
    const seconds = Math.max(0, Math.round(input.seconds))

    const run = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO watch_progress
            (user_id, media_type, tmdb_id, season, episode, title, episode_title, poster_path, backdrop_path,
             genres, runtime_seconds, position_seconds, duration_seconds, watched_seconds, provider, started_at, updated_at)
           VALUES (@userId, @mediaType, @tmdbId, @season, @episode, @title, @episodeTitle, @posterPath, @backdropPath,
             @genres, @runtimeSeconds, @position, @duration, @seconds, @provider, @now, @now)
           ON CONFLICT (user_id, media_type, tmdb_id, season, episode) DO UPDATE SET
             title = excluded.title,
             episode_title = COALESCE(excluded.episode_title, watch_progress.episode_title),
             poster_path = COALESCE(excluded.poster_path, watch_progress.poster_path),
             backdrop_path = COALESCE(excluded.backdrop_path, watch_progress.backdrop_path),
             genres = CASE WHEN excluded.genres = '[]' THEN watch_progress.genres ELSE excluded.genres END,
             runtime_seconds = COALESCE(excluded.runtime_seconds, watch_progress.runtime_seconds),
             position_seconds = COALESCE(excluded.position_seconds, watch_progress.position_seconds),
             duration_seconds = COALESCE(excluded.duration_seconds, watch_progress.duration_seconds),
             watched_seconds = watch_progress.watched_seconds + excluded.watched_seconds,
             provider = COALESCE(excluded.provider, watch_progress.provider),
             updated_at = excluded.updated_at`,
        )
        .run({
          userId,
          mediaType: input.mediaType,
          tmdbId: input.tmdbId,
          season,
          episode,
          title: input.title,
          episodeTitle: input.episodeTitle ?? null,
          posterPath: input.posterPath ?? null,
          backdropPath: input.backdropPath ?? null,
          genres: JSON.stringify(input.genres ?? []),
          runtimeSeconds,
          position: input.position ?? null,
          duration: input.duration ?? null,
          seconds,
          provider: input.provider ?? null,
          now,
        })

      const row = this.db
        .prepare(
          `SELECT * FROM watch_progress
           WHERE user_id = ? AND media_type = ? AND tmdb_id = ? AND season = ? AND episode = ?`,
        )
        .get(userId, input.mediaType, input.tmdbId, season, episode) as ProgressRow

      const completed = computeProgress(row) >= COMPLETION_THRESHOLD
      if (completed && row.completed === 0) {
        this.db
          .prepare(
            `UPDATE watch_progress SET completed = 1
             WHERE user_id = ? AND media_type = ? AND tmdb_id = ? AND season = ? AND episode = ?`,
          )
          .run(userId, input.mediaType, input.tmdbId, season, episode)
        row.completed = 1
      }

      if (seconds > 0) {
        this.db
          .prepare(
            `INSERT INTO watch_activity (user_id, day, seconds) VALUES (?, ?, ?)
             ON CONFLICT (user_id, day) DO UPDATE SET seconds = watch_activity.seconds + excluded.seconds`,
          )
          .run(userId, utcDay(now), seconds)
      }
      return row
    })

    return toProgress(run())
  }

  continueWatching(userId: number, limit = 20): ProgressEntry[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM (
           SELECT *, ROW_NUMBER() OVER (
             PARTITION BY media_type, tmdb_id ORDER BY updated_at DESC
           ) AS rank
           FROM watch_progress WHERE user_id = ?
         )
         WHERE rank = 1 AND NOT (media_type = 'movie' AND completed = 1)
         ORDER BY updated_at DESC LIMIT ?`,
      )
      .all(userId, limit) as ProgressRow[]
    return rows.map(toProgress)
  }

  history(userId: number, limit = 100, offset = 0): ProgressEntry[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM watch_progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?',
      )
      .all(userId, limit, offset) as ProgressRow[]
    return rows.map(toProgress)
  }

  titleProgress(userId: number, mediaType: MediaType, tmdbId: number): ProgressEntry[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM watch_progress WHERE user_id = ? AND media_type = ? AND tmdb_id = ?
         ORDER BY updated_at DESC`,
      )
      .all(userId, mediaType, tmdbId) as ProgressRow[]
    return rows.map(toProgress)
  }

  removeTitle(userId: number, mediaType: MediaType, tmdbId: number): number {
    return this.db
      .prepare('DELETE FROM watch_progress WHERE user_id = ? AND media_type = ? AND tmdb_id = ?')
      .run(userId, mediaType, tmdbId).changes
  }

  clearHistory(userId: number): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM watch_progress WHERE user_id = ?').run(userId)
      this.db.prepare('DELETE FROM watch_activity WHERE user_id = ?').run(userId)
    })()
  }

  stats(userId: number, now = Date.now()) {
    const totals = this.db
      .prepare(
        `SELECT
           COALESCE(SUM(watched_seconds), 0) AS totalSeconds,
           COUNT(DISTINCT CASE WHEN media_type = 'movie' THEN tmdb_id END) AS movies,
           COUNT(DISTINCT CASE WHEN media_type = 'tv' THEN tmdb_id END) AS shows,
           COALESCE(SUM(CASE WHEN media_type = 'tv' THEN 1 ELSE 0 END), 0) AS episodes,
           COALESCE(SUM(completed), 0) AS completed
         FROM watch_progress WHERE user_id = ?`,
      )
      .get(userId) as {
      totalSeconds: number
      movies: number
      shows: number
      episodes: number
      completed: number
    }

    const favoriteCounts = this.db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN media_type = 'movie' THEN 1 ELSE 0 END), 0) AS movies,
           COALESCE(SUM(CASE WHEN media_type = 'tv' THEN 1 ELSE 0 END), 0) AS shows
         FROM favorites WHERE user_id = ?`,
      )
      .get(userId) as { movies: number; shows: number }

    const genreRows = this.db
      .prepare('SELECT genres, watched_seconds FROM watch_progress WHERE user_id = ?')
      .all(userId) as { genres: string; watched_seconds: number }[]
    const genreTotals = new Map<string, number>()
    for (const row of genreRows) {
      let genres: unknown
      try {
        genres = JSON.parse(row.genres)
      } catch {
        genres = []
      }
      if (!Array.isArray(genres)) continue
      for (const genre of genres) {
        if (typeof genre !== 'string') continue
        genreTotals.set(genre, (genreTotals.get(genre) ?? 0) + row.watched_seconds)
      }
    }
    const topGenres = [...genreTotals.entries()]
      .map(([name, seconds]) => ({ name, seconds }))
      .filter((genre) => genre.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 6)

    const topTitles = this.db
      .prepare(
        `SELECT media_type AS mediaType, tmdb_id AS tmdbId, MAX(title) AS title,
           MAX(poster_path) AS posterPath, SUM(watched_seconds) AS seconds
         FROM watch_progress WHERE user_id = ?
         GROUP BY media_type, tmdb_id
         HAVING seconds > 0
         ORDER BY seconds DESC LIMIT 5`,
      )
      .all(userId) as {
      mediaType: MediaType
      tmdbId: number
      title: string
      posterPath: string | null
      seconds: number
    }[]

    const activityRows = this.db
      .prepare('SELECT day, seconds FROM watch_activity WHERE user_id = ? AND day >= ?')
      .all(userId, utcDay(now - 89 * DAY_MS)) as { day: string; seconds: number }[]
    const activityByDay = new Map(activityRows.map((row) => [row.day, row.seconds]))
    const activity: { day: string; seconds: number }[] = []
    for (let offset = 29; offset >= 0; offset -= 1) {
      const day = utcDay(now - offset * DAY_MS)
      activity.push({ day, seconds: activityByDay.get(day) ?? 0 })
    }

    let streak = 0
    for (let offset = 0; offset < 90; offset += 1) {
      const seconds = activityByDay.get(utcDay(now - offset * DAY_MS)) ?? 0
      if (seconds > 0) streak += 1
      else if (offset > 0) break
    }

    const user = this.db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId) as
      { created_at: number } | undefined

    return {
      totalSeconds: totals.totalSeconds,
      moviesWatched: totals.movies,
      showsWatched: totals.shows,
      episodesWatched: totals.episodes,
      completed: totals.completed,
      favorites: { movies: favoriteCounts.movies, shows: favoriteCounts.shows },
      topGenres,
      topTitles,
      activity,
      streak,
      memberSince: user?.created_at ?? now,
    }
  }
}
