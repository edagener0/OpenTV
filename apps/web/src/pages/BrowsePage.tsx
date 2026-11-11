import { useInfiniteQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronDown, Clapperboard, Tv } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/AppLayout'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useGenres } from '@/hooks/useGenres'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import {
  dedupe,
  type MediaSummary,
  type MediaType,
  type Paged,
  SORT_OPTIONS,
  tmdb,
} from '@/lib/tmdb'

const MAX_PAGES = 500

function discoverParams(mediaType: MediaType, sort: string, genre: string | null) {
  const today = new Date().toISOString().slice(0, 10)
  const params: Record<string, string | undefined> = {
    sort_by: sort,
    with_genres: genre ?? undefined,
  }
  if (sort.startsWith('vote_average')) params['vote_count.gte'] = '300'
  if (sort.includes('date')) {
    params['vote_count.gte'] = '20'
    params[mediaType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte'] = today
  }
  return params
}

export function BrowsePage({ mediaType }: { mediaType: MediaType }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortOptions = SORT_OPTIONS[mediaType]
  const sort = sortOptions.some((option) => option.value === searchParams.get('sort'))
    ? (searchParams.get('sort') as string)
    : sortOptions[0]!.value
  const genre = searchParams.get('genre')
  const genres = useGenres(mediaType)
  const label = mediaType === 'movie' ? 'Movies' : 'TV Shows'
  useDocumentTitle(label)

  const params = discoverParams(mediaType, sort, genre)
  const query = useInfiniteQuery({
    queryKey: ['tmdb', `discover/${mediaType}`, params],
    queryFn: ({ pageParam, signal }) =>
      tmdb<Paged<MediaSummary>>(`discover/${mediaType}`, { ...params, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, MAX_PAGES) ? last.page + 1 : undefined,
    staleTime: 10 * 60 * 1000,
  })

  const sentinel = useInfiniteScroll(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }, Boolean(query.hasNextPage))

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const items = dedupe((query.data?.pages ?? []).flatMap((page) => page.results))
  const Icon = mediaType === 'movie' ? Clapperboard : Tv
  const chip =
    'shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition whitespace-nowrap'

  return (
    <PageContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_65%)]" />
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{label}</h1>
            <p className="mt-1 text-sm text-ink-400">
              {query.data?.pages[0]
                ? `${query.data.pages[0].total_results.toLocaleString()} titles to explore`
                : 'Discover something new'}
            </p>
          </div>
        </div>
        <label className="relative">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(event) => update('sort', event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-ink-850 pl-4 pr-10 text-sm font-medium text-white transition focus:border-brand-500/60 focus:outline-none sm:w-52"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        </label>
      </header>

      <div className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        <button
          type="button"
          onClick={() => update('genre', null)}
          className={clsx(
            chip,
            !genre
              ? 'bg-white text-ink-900 ring-white'
              : 'bg-white/5 text-ink-200 ring-white/10 hover:bg-white/10',
          )}
        >
          All
        </button>
        {(genres.data ?? []).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => update('genre', genre === String(item.id) ? null : String(item.id))}
            className={clsx(
              chip,
              genre === String(item.id)
                ? 'bg-white text-ink-900 ring-white'
                : 'bg-white/5 text-ink-200 ring-white/10 hover:bg-white/10',
            )}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {query.isPending ? (
          <MediaGridSkeleton />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Icon}
            title="Nothing here yet"
            description="Try another genre or sort order."
          />
        ) : (
          <MediaGrid
            items={items}
            fallbackType={mediaType}
            loadingMore={query.isFetchingNextPage}
          />
        )}
        <div ref={sentinel} aria-hidden="true" className="h-px" />
      </div>
    </PageContainer>
  )
}
