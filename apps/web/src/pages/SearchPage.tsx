import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Search, SearchX, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/AppLayout'
import { MediaGrid, MediaGridSkeleton } from '@/components/media/MediaGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { dedupe, type MediaSummary, type Paged, tmdb, tmdbKeys } from '@/lib/tmdb'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = searchParams.get('q') ?? ''
  const [value, setValue] = useState(initial)
  const debounced = useDebouncedValue(value.trim(), 350)
  const input = useRef<HTMLInputElement | null>(null)
  useDocumentTitle(debounced ? `Search: ${debounced}` : 'Search')

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (current === debounced) return
    const next = new URLSearchParams(searchParams)
    if (debounced) next.set('q', debounced)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }, [debounced, searchParams, setSearchParams])

  const results = useInfiniteQuery({
    queryKey: ['tmdb', 'search/multi', debounced],
    queryFn: ({ pageParam, signal }) =>
      tmdb<Paged<MediaSummary>>('search/multi', { query: debounced, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 50) ? last.page + 1 : undefined,
    enabled: debounced.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const trending = useQuery({
    queryKey: tmdbKeys.list('trending/all/week'),
    queryFn: ({ signal }) => tmdb<Paged<MediaSummary>>('trending/all/week', {}, signal),
    enabled: debounced.length === 0,
    staleTime: 10 * 60 * 1000,
  })

  const sentinel = useInfiniteScroll(() => {
    if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage()
  }, Boolean(results.hasNextPage))

  const items = dedupe(
    (results.data?.pages ?? [])
      .flatMap((page) => page.results)
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv'),
  )

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-3xl font-bold text-white sm:text-4xl">
          Find your next <span className="text-gradient">obsession</span>
        </h1>
        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            ref={input}
            type="search"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search for movies and TV shows"
            aria-label="Search for movies and TV shows"
            className="h-14 w-full rounded-2xl border border-white/10 bg-ink-850 pl-14 pr-14 text-base text-white shadow-2xl shadow-black/30 placeholder:text-ink-400 transition focus:border-brand-500/60 focus:outline-none focus:ring-4 focus:ring-brand-500/15 [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue('')
                input.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-12">
        {debounced.length === 0 ? (
          <>
            <SectionHeader title="Trending this week" subtitle="Popular picks while you decide" />
            {trending.isPending ? (
              <MediaGridSkeleton count={12} />
            ) : (
              <MediaGrid
                items={(trending.data?.results ?? []).filter(
                  (item) => item.media_type !== 'person',
                )}
                showType
              />
            )}
          </>
        ) : results.isPending ? (
          <MediaGridSkeleton count={12} />
        ) : results.isError ? (
          <ErrorState error={results.error} onRetry={() => void results.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`No results for "${debounced}"`}
            description="Check the spelling or try a different title."
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-ink-400">
              Results for{' '}
              <span className="font-semibold text-white">&ldquo;{debounced}&rdquo;</span>
            </p>
            <MediaGrid items={items} showType loadingMore={results.isFetchingNextPage} />
          </>
        )}
        <div ref={sentinel} aria-hidden="true" className="h-px" />
      </div>
    </PageContainer>
  )
}
