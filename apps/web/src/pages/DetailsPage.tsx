import { Clapperboard, Play, RotateCcw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { PageContainer } from '@/components/layout/AppLayout'
import { Carousel } from '@/components/media/Carousel'
import { EpisodeList, SeasonSelect } from '@/components/media/EpisodeList'
import { FavoriteButton } from '@/components/media/FavoriteButton'
import { StaticMediaRow } from '@/components/media/MediaRow'
import { Poster } from '@/components/media/Poster'
import { TrailerModal } from '@/components/media/TrailerModal'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMediaDetails, useSeason, useTitleProgress } from '@/hooks/useMedia'
import { episodeLabel, formatDate, formatRuntime } from '@/lib/format'
import {
  type CastMember,
  dateOf,
  imageUrl,
  type MediaDetails,
  type MediaType,
  pickSeason,
  pickTrailer,
  playableSeasons,
  titleOf,
  yearOf,
} from '@/lib/tmdb'
import { NotFoundPage } from './NotFoundPage'

function DetailsSkeleton() {
  return (
    <div>
      <div className="skeleton h-[60svh] w-full" />
      <div className="mx-auto -mt-40 flex max-w-[1800px] gap-8 px-4 sm:px-6 lg:px-10">
        <div className="skeleton hidden aspect-[2/3] w-64 shrink-0 rounded-2xl md:block" />
        <div className="flex-1 space-y-4 pt-10">
          <div className="skeleton h-12 w-2/3 rounded-xl" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-20 w-full max-w-2xl rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function CastRow({ cast }: { cast: CastMember[] }) {
  const visible = cast.slice(0, 20)
  if (visible.length === 0) return null
  return (
    <section>
      <SectionHeader title="Cast" />
      <Carousel>
        {visible.map((person) => {
          const role = person.character ?? person.roles?.[0]?.character
          return (
            <div key={person.id} className="w-28 shrink-0 snap-start text-center sm:w-32">
              <div className="mx-auto aspect-square w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
                {person.profile_path ? (
                  <img
                    src={imageUrl(person.profile_path, 'w185') ?? ''}
                    alt={person.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center font-display text-2xl font-bold text-ink-400">
                    {person.name.slice(0, 1)}
                  </span>
                )}
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-white">{person.name}</p>
              {role && <p className="truncate text-xs text-ink-400">{role}</p>}
            </div>
          )
        })}
      </Carousel>
    </section>
  )
}

function InfoList({ details, mediaType }: { details: MediaDetails; mediaType: MediaType }) {
  const rows: [string, string | null | undefined][] = [
    ['Status', details.status],
    [mediaType === 'movie' ? 'Released' : 'First aired', formatDate(dateOf(details))],
    [
      mediaType === 'movie' ? 'Studio' : 'Network',
      (mediaType === 'movie' ? details.production_companies : details.networks)
        ?.slice(0, 2)
        .map((item) => item.name)
        .join(', '),
    ],
    [
      'Languages',
      details.spoken_languages
        ?.slice(0, 3)
        .map((language) => language.english_name)
        .join(', '),
    ],
  ]
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/5 sm:grid-cols-4">
      {rows
        .filter(([, value]) => Boolean(value))
        .map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wider text-ink-400">{label}</dt>
            <dd className="mt-1 truncate text-sm text-ink-100">{value}</dd>
          </div>
        ))}
    </dl>
  )
}

function SeasonsSection({
  details,
  progressTitle,
}: {
  details: MediaDetails
  progressTitle: ReturnType<typeof useTitleProgress>
}) {
  const seasons = playableSeasons(details.seasons)
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = pickSeason(seasons, searchParams.get('season'))
  const season = useSeason(details.id, seasons.length > 0 ? selected : null)

  if (seasons.length === 0) return null

  return (
    <section>
      <SectionHeader
        title="Episodes"
        action={
          <SeasonSelect
            seasons={seasons}
            value={selected}
            onChange={(value) => {
              const next = new URLSearchParams(searchParams)
              next.set('season', String(value))
              setSearchParams(next, { replace: true, preventScrollReset: true })
            }}
            className="w-56"
          />
        }
      />
      {season.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton aspect-[16/12] rounded-2xl" />
          ))}
        </div>
      ) : season.isError ? (
        <ErrorState error={season.error} onRetry={() => void season.refetch()} />
      ) : (
        <EpisodeList
          tvId={details.id}
          episodes={season.data.episodes}
          progress={progressTitle.data}
        />
      )}
    </section>
  )
}

export function DetailsPage({ mediaType }: { mediaType: MediaType }) {
  const params = useParams()
  const id = Number(params.id)
  const details = useMediaDetails(mediaType, id)
  const progress = useTitleProgress(mediaType, id)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const closeTrailer = useCallback(() => setTrailerOpen(false), [])
  useDocumentTitle(details.data ? titleOf(details.data) : undefined)

  if (!Number.isInteger(id) || id <= 0) return <NotFoundPage />
  if (details.isPending) return <DetailsSkeleton />
  if (details.isError) {
    return (
      <PageContainer>
        <ErrorState error={details.error} onRetry={() => void details.refetch()} />
      </PageContainer>
    )
  }

  const data = details.data
  const title = titleOf(data)
  const trailer = pickTrailer(data.videos?.results)
  const latest = progress.data?.[0]
  const runtime =
    mediaType === 'movie' ? formatRuntime(data.runtime) : formatRuntime(data.episode_run_time?.[0])
  const firstSeason = playableSeasons(data.seasons)[0]?.season_number ?? 1

  let playPath = mediaType === 'movie' ? `/watch/movie/${id}` : `/watch/tv/${id}/${firstSeason}/1`
  let playLabel = mediaType === 'movie' ? 'Watch now' : `Play S${firstSeason} E1`
  let resuming = false
  if (latest) {
    if (mediaType === 'tv' && latest.season !== null && latest.episode !== null) {
      playPath = `/watch/tv/${id}/${latest.season}/${latest.episode}`
      playLabel = `Resume ${episodeLabel(latest.season, latest.episode)}`
      resuming = true
    } else if (mediaType === 'movie' && !latest.completed && latest.watchedSeconds > 0) {
      playLabel = 'Resume'
      resuming = true
    }
  }

  const cast = (mediaType === 'movie' ? data.credits?.cast : data.aggregate_credits?.cast) ?? []
  const recommendations = data.recommendations?.results ?? []
  const similar = data.similar?.results ?? []
  const meta = [
    yearOf(data),
    runtime,
    mediaType === 'tv' && data.number_of_seasons
      ? `${data.number_of_seasons} season${data.number_of_seasons === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean)

  return (
    <article>
      <div className="relative h-[55svh] min-h-[420px] w-full overflow-hidden lg:h-[70svh]">
        {data.backdrop_path && (
          <img
            src={imageUrl(data.backdrop_path, 'original') ?? ''}
            alt=""
            className="size-full animate-hero-zoom object-cover object-[center_25%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-ink-900/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/90 via-ink-900/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-56 max-w-[1800px] px-4 sm:-mt-64 sm:px-6 lg:-mt-80 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end">
          <Poster
            path={data.poster_path}
            alt={title}
            size="w500"
            eager
            className="hidden aspect-[2/3] w-56 shrink-0 rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10 md:block lg:w-72"
          />
          <div className="min-w-0 flex-1 animate-rise">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
                {mediaType === 'tv' ? 'Series' : 'Movie'}
              </span>
              {data.genres.slice(0, 4).map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-200 ring-1 ring-brand-400/25"
                >
                  {genre.name}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {data.tagline && <p className="mt-2 text-lg italic text-ink-300">{data.tagline}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-200">
              <RatingBadge value={data.vote_average} className="!bg-white/10 text-sm" />
              {meta.map((item, index) => (
                <span key={item} className="flex items-center gap-3">
                  {index > 0 && <span className="size-1 rounded-full bg-ink-500" />}
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to={playPath} size="lg">
                {resuming ? (
                  <RotateCcw className="size-5" aria-hidden="true" />
                ) : (
                  <Play className="size-5 fill-current" aria-hidden="true" />
                )}
                {playLabel}
              </ButtonLink>
              {trailer && (
                <Button variant="secondary" size="lg" onClick={() => setTrailerOpen(true)}>
                  <Clapperboard className="size-5" aria-hidden="true" />
                  Trailer
                </Button>
              )}
              <FavoriteButton
                mediaType={mediaType}
                tmdbId={id}
                payload={{
                  title,
                  posterPath: data.poster_path,
                  backdropPath: data.backdrop_path,
                  voteAverage: data.vote_average ?? null,
                  releaseDate: dateOf(data) ?? null,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <h2 className="text-xl font-bold text-white">Overview</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink-200">
              {data.overview || 'No overview available yet.'}
            </p>
          </div>
          <InfoList details={data} mediaType={mediaType} />
        </div>

        <div className="mt-14 space-y-14">
          {mediaType === 'tv' && <SeasonsSection details={data} progressTitle={progress} />}
          <CastRow cast={cast} />
          <StaticMediaRow
            title="You might also like"
            items={recommendations}
            fallbackType={mediaType}
          />
          {recommendations.length === 0 && (
            <StaticMediaRow title="Similar titles" items={similar} fallbackType={mediaType} />
          )}
        </div>
      </div>

      {trailerOpen && trailer && <TrailerModal videoKey={trailer.key} onClose={closeTrailer} />}
    </article>
  )
}
