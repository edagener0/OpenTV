import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Info, Play } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { useGenreLookup } from '@/hooks/useGenres'
import { watchPath } from '@/lib/paths'
import {
  imageUrl,
  type MediaSummary,
  mediaTypeOf,
  type Paged,
  titleOf,
  tmdb,
  tmdbKeys,
  yearOf,
} from '@/lib/tmdb'

const SLIDE_MS = 8000

export function Hero() {
  const query = useQuery({
    queryKey: tmdbKeys.list('trending/all/day'),
    queryFn: ({ signal }) => tmdb<Paged<MediaSummary>>('trending/all/day', {}, signal),
    staleTime: 10 * 60 * 1000,
  })
  const genres = useGenreLookup()
  const slides = (query.data?.results ?? [])
    .filter((item) => item.backdrop_path && item.media_type !== 'person' && item.overview)
    .slice(0, 6)

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setActive((current) => (slides.length ? (current + 1) % slides.length : 0))
  }, [slides.length])

  useEffect(() => {
    if (paused || slides.length < 2) return
    const timer = window.setTimeout(next, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [active, paused, next, slides.length])

  if (query.isPending) {
    return <div className="skeleton h-[78svh] min-h-[520px] w-full" />
  }

  if (slides.length === 0) return <div className="h-24" />

  const current = slides[Math.min(active, slides.length - 1)]!
  const mediaType = mediaTypeOf(current)
  const title = titleOf(current)
  const genreNames = (current.genre_ids ?? [])
    .map((id) => genres.get(id))
    .filter(Boolean)
    .slice(0, 3)

  return (
    <section
      className="relative h-[78svh] min-h-[520px] w-full overflow-hidden lg:h-[88svh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Trending today"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          aria-hidden={index !== active}
          className={clsx(
            'absolute inset-0 transition-opacity duration-1000',
            index === active ? 'opacity-100' : 'opacity-0',
          )}
        >
          <img
            src={imageUrl(slide.backdrop_path, 'original') ?? ''}
            alt=""
            loading={index === 0 ? 'eager' : 'lazy'}
            className={clsx(
              'size-full object-cover object-[center_20%]',
              index === active && 'animate-hero-zoom',
            )}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-ink-900/40" />

      <div className="relative mx-auto flex h-full max-w-[1800px] items-end px-4 pb-24 sm:px-6 lg:px-10 lg:pb-32">
        <div key={current.id} className="max-w-2xl animate-rise">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand-500/20 px-3 py-1 uppercase tracking-wider text-brand-200 ring-1 ring-brand-400/30 backdrop-blur-md">
              #{active + 1} Trending today
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 uppercase tracking-wider text-white/90 backdrop-blur-md">
              {mediaType === 'tv' ? 'Series' : 'Movie'}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] text-white drop-shadow-2xl sm:text-5xl lg:text-7xl">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-200">
            <RatingBadge value={current.vote_average} className="!bg-white/10 text-sm" />
            {yearOf(current) && <span>{yearOf(current)}</span>}
            {genreNames.length > 0 && (
              <>
                <span className="size-1 rounded-full bg-ink-400" />
                <span>{genreNames.join(' · ')}</span>
              </>
            )}
          </div>
          <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">
            {current.overview}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to={watchPath(mediaType, current.id)} size="lg">
              <Play className="size-5 fill-current" aria-hidden="true" />
              Watch now
            </ButtonLink>
            <ButtonLink to={`/${mediaType}/${current.id}`} variant="secondary" size="lg">
              <Info className="size-5" aria-hidden="true" />
              More info
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 mx-auto flex max-w-[1800px] justify-center gap-2 px-4 sm:justify-end sm:px-6 lg:bottom-20 lg:px-10">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show ${titleOf(slide)}`}
            aria-current={index === active}
            className="group relative h-1.5 overflow-hidden rounded-full bg-white/20 transition-all duration-500"
            style={{ width: index === active ? 40 : 14 }}
          >
            {index === active && (
              <span
                key={`${slide.id}-${paused}`}
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                style={{
                  animation: paused ? 'none' : `hero-progress ${SLIDE_MS}ms linear forwards`,
                  width: paused ? '100%' : undefined,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
