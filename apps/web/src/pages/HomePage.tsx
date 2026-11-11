import { AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/layout/AppLayout'
import { ContinueWatchingRow } from '@/components/media/ContinueWatchingRow'
import { Hero } from '@/components/media/Hero'
import { MediaRow } from '@/components/media/MediaRow'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useServerInfo } from '@/hooks/useServer'

export function HomePage() {
  useDocumentTitle(undefined)
  const info = useServerInfo()

  if (info.data && !info.data.tmdbConfigured) {
    return (
      <PageContainer>
        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-amber-400/20 bg-amber-400/5 p-8">
          <AlertTriangle className="size-8 text-amber-300" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-white">Almost there</h1>
          <p className="mt-3 text-ink-300">
            This OpenTV server does not have a TMDB API key yet. Create a free key at
            themoviedb.org, set it as{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">TMDB_API_KEY</code> in your
            environment and restart the server.
          </p>
        </div>
      </PageContainer>
    )
  }

  return (
    <>
      <Hero />
      <div className="relative z-10 mx-auto -mt-8 max-w-[1800px] space-y-12 px-4 sm:px-6 lg:-mt-14 lg:space-y-14 lg:px-10">
        <ContinueWatchingRow />
        <MediaRow
          title="Trending movies"
          path="trending/movie/week"
          fallbackType="movie"
          to="/movies"
        />
        <MediaRow title="Trending series" path="trending/tv/week" fallbackType="tv" to="/tv" />
        <MediaRow title="Popular movies" path="movie/popular" fallbackType="movie" to="/movies" />
        <MediaRow title="Binge-worthy series" path="tv/popular" fallbackType="tv" to="/tv" />
        <MediaRow title="In theaters" path="movie/now_playing" fallbackType="movie" />
        <MediaRow
          title="Critically acclaimed films"
          path="movie/top_rated"
          fallbackType="movie"
          to="/movies?sort=vote_average.desc"
        />
        <MediaRow title="Airing today" path="tv/airing_today" fallbackType="tv" />
        <MediaRow
          title="Top rated series"
          path="tv/top_rated"
          fallbackType="tv"
          to="/tv?sort=vote_average.desc"
        />
      </div>
    </>
  )
}
