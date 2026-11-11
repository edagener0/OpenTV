import clsx from 'clsx'
import { Check, ChevronDown, Film, Play } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate, formatRuntime } from '@/lib/format'
import type { ProgressEntry } from '@/lib/library'
import { type Episode, imageUrl, type SeasonSummary } from '@/lib/tmdb'

export function SeasonSelect({
  seasons,
  value,
  onChange,
  className,
  compact,
}: {
  seasons: SeasonSummary[]
  value: number
  onChange: (season: number) => void
  className?: string
  compact?: boolean
}) {
  return (
    <label className={clsx('relative block', className)}>
      <span className="sr-only">Season</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-ink-800 pl-4 pr-10 text-sm font-semibold text-white transition focus:border-brand-500/60 focus:outline-none"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.season_number}>
            {season.season_number === 0 ? 'Specials' : `Season ${season.season_number}`}
            {compact ? '' : ` · ${season.episode_count} episodes`}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
    </label>
  )
}

function progressFor(progress: ProgressEntry[] | undefined, episode: Episode) {
  return progress?.find(
    (entry) => entry.season === episode.season_number && entry.episode === episode.episode_number,
  )
}

interface EpisodeListProps {
  tvId: number
  episodes: Episode[]
  progress?: ProgressEntry[] | undefined
  activeEpisode?: number | undefined
  activeSeason?: number | undefined
  variant?: 'grid' | 'compact'
}

export function EpisodeList({
  tvId,
  episodes,
  progress,
  activeEpisode,
  activeSeason,
  variant = 'grid',
}: EpisodeListProps) {
  const today = new Date().toISOString().slice(0, 10)

  if (variant === 'compact') {
    return (
      <ol className="space-y-1.5">
        {episodes.map((episode) => {
          const entry = progressFor(progress, episode)
          const active =
            episode.episode_number === activeEpisode && episode.season_number === activeSeason
          const unreleased = Boolean(episode.air_date && episode.air_date > today)
          return (
            <li key={episode.id}>
              <Link
                to={`/watch/tv/${tvId}/${episode.season_number}/${episode.episode_number}`}
                aria-current={active ? 'true' : undefined}
                className={clsx(
                  'group flex items-center gap-3 rounded-xl p-2 transition',
                  active ? 'bg-brand-500/15 ring-1 ring-brand-400/40' : 'hover:bg-white/5',
                  unreleased && 'opacity-50',
                )}
              >
                <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-ink-750 to-ink-850">
                  {!episode.still_path && (
                    <Film
                      className="absolute inset-0 m-auto size-5 text-ink-500"
                      aria-hidden="true"
                    />
                  )}
                  {episode.still_path && (
                    <img
                      src={imageUrl(episode.still_path, 'w300') ?? ''}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                  {active && (
                    <span className="absolute inset-0 grid place-items-center bg-black/50">
                      <span className="flex items-end gap-0.5" aria-hidden="true">
                        <span className="h-3 w-0.5 animate-pulse rounded bg-white" />
                        <span className="h-4 w-0.5 animate-pulse rounded bg-white [animation-delay:150ms]" />
                        <span className="h-2.5 w-0.5 animate-pulse rounded bg-white [animation-delay:300ms]" />
                      </span>
                    </span>
                  )}
                  {entry && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
                      <span
                        className="block h-full bg-brand-500"
                        style={{
                          width: `${Math.round((entry.completed ? 1 : Math.max(entry.progress, 0.05)) * 100)}%`,
                        }}
                      />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-300">
                    Episode {episode.episode_number}
                  </p>
                  <p
                    className={clsx(
                      'truncate text-sm font-medium',
                      active ? 'text-white' : 'text-ink-200',
                    )}
                  >
                    {episode.name}
                  </p>
                  <p className="text-xs text-ink-400">
                    {unreleased
                      ? `Airs ${formatDate(episode.air_date)}`
                      : formatRuntime(episode.runtime)}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {episodes.map((episode) => {
        const entry = progressFor(progress, episode)
        const unreleased = Boolean(episode.air_date && episode.air_date > today)
        return (
          <li key={episode.id}>
            <Link
              to={`/watch/tv/${tvId}/${episode.season_number}/${episode.episode_number}`}
              className={clsx(
                'group block overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:ring-brand-400/40',
                unreleased && 'opacity-60',
              )}
            >
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-ink-750 to-ink-850">
                {!episode.still_path && (
                  <Film
                    className="absolute inset-0 m-auto size-8 text-ink-500"
                    aria-hidden="true"
                  />
                )}
                {episode.still_path && (
                  <img
                    src={imageUrl(episode.still_path, 'w780') ?? ''}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                  E{episode.episode_number}
                </span>
                {entry?.completed && (
                  <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-brand-500 text-white">
                    <Check className="size-3.5" aria-label="Watched" />
                  </span>
                )}
                <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                  <span className="grid size-11 place-items-center rounded-full bg-white/95 text-ink-900">
                    <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />
                  </span>
                </span>
                {entry && !entry.completed && (
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                    <span
                      className="block h-full bg-brand-500"
                      style={{ width: `${Math.round(Math.max(entry.progress, 0.05) * 100)}%` }}
                    />
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="truncate text-sm font-semibold text-white">{episode.name}</h4>
                  <span className="shrink-0 text-xs text-ink-400">
                    {unreleased ? formatDate(episode.air_date) : formatRuntime(episode.runtime)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-400">
                  {episode.overview || 'No description available.'}
                </p>
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
