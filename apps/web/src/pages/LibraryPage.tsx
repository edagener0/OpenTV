import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Clock, Heart, History, Library, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/AppLayout'
import { ContinueCard } from '@/components/media/ContinueCard'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useUser } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { episodeLabel, formatRelative, formatWatchTime } from '@/lib/format'
import { type Favorite, libraryApi, libraryKeys, type ProgressEntry } from '@/lib/library'
import { progressWatchPath } from '@/lib/paths'
import { imageUrl, type MediaSummary } from '@/lib/tmdb'

const TABS = [
  { id: 'continue', label: 'Continue watching', icon: Clock },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'history', label: 'History', icon: History },
] as const

type TabId = (typeof TABS)[number]['id']

function favoriteToSummary(favorite: Favorite): MediaSummary {
  return {
    id: favorite.tmdbId,
    media_type: favorite.mediaType,
    ...(favorite.mediaType === 'movie'
      ? { title: favorite.title, release_date: favorite.releaseDate ?? '' }
      : { name: favorite.title, first_air_date: favorite.releaseDate ?? '' }),
    poster_path: favorite.posterPath,
    backdrop_path: favorite.backdropPath,
    vote_average: favorite.voteAverage ?? 0,
  }
}

function useRemoveTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entry: ProgressEntry) => libraryApi.removeTitle(entry.mediaType, entry.tmdbId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: libraryKeys.all }),
  })
}

function ContinueTab() {
  const query = useQuery({ queryKey: libraryKeys.continue, queryFn: libraryApi.continueWatching })
  const remove = useRemoveTitle()
  if (query.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton aspect-video rounded-2xl" />
        ))}
      </div>
    )
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Nothing in progress"
        description="Start a movie or episode and it will show up here so you can resume later."
        action={<ButtonLink to="/">Discover something</ButtonLink>}
      />
    )
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {query.data.map((entry) => (
        <ContinueCard
          key={`${entry.mediaType}-${entry.tmdbId}`}
          entry={entry}
          onRemove={(item) => remove.mutate(item)}
        />
      ))}
    </div>
  )
}

function FavoritesTab() {
  const query = useQuery({ queryKey: libraryKeys.favorites, queryFn: libraryApi.favorites })
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all')
  if (query.isPending) return <MediaGridSkeleton count={12} />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favorites yet"
        description="Tap the heart on any movie or show to keep it here."
        action={<ButtonLink to="/movies">Browse movies</ButtonLink>}
      />
    )
  }
  const items = query.data.filter((item) => filter === 'all' || item.mediaType === filter)
  return (
    <>
      <div className="mb-6 flex gap-2">
        {(['all', 'movie', 'tv'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition',
              filter === value
                ? 'bg-white text-ink-900 ring-white'
                : 'bg-white/5 text-ink-200 ring-white/10 hover:bg-white/10',
            )}
          >
            {value === 'all' ? 'All' : value === 'movie' ? 'Movies' : 'TV Shows'}
          </button>
        ))}
      </div>
      <MediaGrid items={items.map(favoriteToSummary)} showType />
    </>
  )
}

function HistoryTab() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: libraryKeys.history, queryFn: () => libraryApi.history(200) })
  const remove = useRemoveTitle()
  const [confirming, setConfirming] = useState(false)
  const clear = useMutation({
    mutationFn: libraryApi.clearHistory,
    onSuccess: () => {
      setConfirming(false)
      void queryClient.invalidateQueries({ queryKey: libraryKeys.all })
    },
  })

  if (query.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    )
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Your history is empty"
        description="Everything you watch while signed in will be listed here."
      />
    )
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
        {confirming ? (
          <>
            <span className="text-sm text-ink-300">Delete your entire watch history?</span>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => clear.mutate()}
              disabled={clear.isPending}
            >
              Yes, clear it
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Clear history
          </Button>
        )}
      </div>
      <ul className="space-y-3">
        {query.data.map((entry) => {
          const poster = imageUrl(entry.posterPath, 'w185')
          const label = episodeLabel(entry.season, entry.episode)
          return (
            <li
              key={`${entry.mediaType}-${entry.tmdbId}-${entry.season}-${entry.episode}`}
              className="group flex items-center gap-4 rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5 transition hover:ring-white/10"
            >
              <Link to={progressWatchPath(entry)} className="shrink-0">
                <div className="aspect-[2/3] w-14 overflow-hidden rounded-lg bg-ink-800 sm:w-16">
                  {poster && (
                    <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
                  )}
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/${entry.mediaType}/${entry.tmdbId}`}
                  className="block truncate font-semibold text-white transition hover:text-brand-300"
                >
                  {entry.title}
                </Link>
                <p className="mt-0.5 truncate text-sm text-ink-400">
                  {[label, entry.episodeTitle].filter(Boolean).join(' · ') ||
                    (entry.mediaType === 'movie' ? 'Movie' : 'Series')}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10 sm:w-40">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                      style={{
                        width: `${Math.round((entry.completed ? 1 : entry.progress) * 100)}%`,
                      }}
                    />
                  </div>
                  <span>{formatWatchTime(entry.watchedSeconds)} watched</span>
                  <span className="hidden sm:inline">· {formatRelative(entry.updatedAt)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(entry)}
                aria-label={`Remove ${entry.title} from history`}
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function LibraryPage() {
  useDocumentTitle('My Library')
  const user = useUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const tab: TabId = TABS.some((item) => item.id === requested) ? (requested as TabId) : 'continue'

  return (
    <PageContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(236,72,153,0.12),transparent_65%)]" />
      <header className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25">
          <Library className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">My Library</h1>
          <p className="mt-1 text-sm text-ink-400">
            Your progress, favorites and history in one place.
          </p>
        </div>
      </header>

      {!user ? (
        <div className="mt-10">
          <EmptyState
            icon={Library}
            title="Sign in to build your library"
            description="Watching works without an account, but signing in lets you resume, keep favorites and see your stats."
            action={
              <div className="flex gap-3">
                <ButtonLink to="/login" state={{ from: '/library' }}>
                  Sign in
                </ButtonLink>
                <ButtonLink to="/register" variant="secondary" state={{ from: '/library' }}>
                  Create account
                </ButtonLink>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Library sections"
            className="scrollbar-none -mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-white/5 px-4 sm:mx-0 sm:px-0"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setSearchParams({ tab: id }, { replace: true })}
                className={clsx(
                  'relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition',
                  tab === id ? 'text-white' : 'text-ink-400 hover:text-ink-200',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
                {tab === id && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-accent-500" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-8" role="tabpanel">
            {tab === 'continue' && <ContinueTab />}
            {tab === 'favorites' && <FavoritesTab />}
            {tab === 'history' && <HistoryTab />}
          </div>
        </>
      )}
    </PageContainer>
  )
}
