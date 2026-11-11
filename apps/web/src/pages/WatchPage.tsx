import clsx from 'clsx'
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { EpisodeList, SeasonSelect } from '@/components/media/EpisodeList'
import { FavoriteButton } from '@/components/media/FavoriteButton'
import { ServerSelector } from '@/components/media/ServerSelector'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { Spinner } from '@/components/ui/Spinner'
import { useUser } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMediaDetails, useSeason, useTitleProgress } from '@/hooks/useMedia'
import { useProviders } from '@/hooks/useServer'
import { useWatchTracker } from '@/hooks/useWatchTracker'
import { episodeLabel, formatRuntime } from '@/lib/format'
import { readPreference, writePreference } from '@/lib/platform'
import { buildEmbedUrl, originOf } from '@/lib/providers'
import { dateOf, type MediaType, playableSeasons, titleOf, yearOf } from '@/lib/tmdb'
import { NotFoundPage } from './NotFoundPage'

const SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock'

function parseIndex(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export function WatchPage({ mediaType }: { mediaType: MediaType }) {
  const params = useParams()
  const navigate = useNavigate()
  const id = Number(params.id)
  const seasonNumber = parseIndex(params.season, 1)
  const episodeNumber = parseIndex(params.episode, 1)
  const isTv = mediaType === 'tv'

  const user = useUser()
  const details = useMediaDetails(mediaType, id)
  const season = useSeason(id, isTv ? seasonNumber : null)
  const progress = useTitleProgress(mediaType, id)
  const providers = useProviders()

  const [providerId, setProviderId] = useState(() => readPreference('provider', ''))
  const [adShield, setAdShield] = useState(() => readPreference('adShield', 'off') === 'on')
  const [reloadKey, setReloadKey] = useState(0)
  const [loadedFrame, setLoadedFrame] = useState<string | null>(null)

  const providerList = providers.data ?? []
  const provider =
    providerList.find((item) => item.id === providerId) ??
    providerList.find((item) => item.recommended) ??
    providerList[0]

  const embedUrl = provider
    ? buildEmbedUrl(provider, {
        mediaType,
        tmdbId: id,
        ...(isTv ? { season: seasonNumber, episode: episodeNumber } : {}),
      })
    : null

  const frameKey = embedUrl ? `${embedUrl}-${reloadKey}-${adShield ? 'shield' : 'open'}` : null
  const loading = frameKey !== null && loadedFrame !== frameKey

  const data = details.data
  const title = data ? titleOf(data) : ''
  const episode = season.data?.episodes.find((item) => item.episode_number === episodeNumber)
  const label = isTv ? episodeLabel(seasonNumber, episodeNumber) : null
  useDocumentTitle(data ? (label ? `${title} ${label}` : title) : 'Watch')

  const seasons = useMemo(() => playableSeasons(data?.seasons), [data?.seasons])
  const navigation = (() => {
    if (!isTv) return { prev: null, next: null }
    const episodes = season.data?.episodes ?? []
    const currentIndex = seasons.findIndex((item) => item.season_number === seasonNumber)
    const prevSeason = currentIndex > 0 ? seasons[currentIndex - 1] : undefined
    const nextSeason = currentIndex >= 0 ? seasons[currentIndex + 1] : undefined
    const lastInSeason =
      episodes.at(-1)?.episode_number ?? seasons[currentIndex]?.episode_count ?? episodeNumber
    const prev =
      episodeNumber > 1
        ? { season: seasonNumber, episode: episodeNumber - 1 }
        : prevSeason
          ? { season: prevSeason.season_number, episode: prevSeason.episode_count }
          : null
    const next =
      episodeNumber < lastInSeason
        ? { season: seasonNumber, episode: episodeNumber + 1 }
        : nextSeason
          ? { season: nextSeason.season_number, episode: 1 }
          : null
    return { prev, next }
  })()

  const trackerContext =
    data && Number.isInteger(id)
      ? {
          mediaType,
          tmdbId: id,
          ...(isTv ? { season: seasonNumber, episode: episodeNumber } : {}),
          title,
          episodeTitle: episode?.name ?? null,
          posterPath: data.poster_path,
          backdropPath: episode?.still_path ?? data.backdrop_path,
          genres: data.genres.map((genre) => genre.name),
          runtimeMinutes: isTv
            ? (episode?.runtime ?? data.episode_run_time?.[0] ?? null)
            : (data.runtime ?? null),
          provider: provider?.id ?? null,
        }
      : null

  useWatchTracker(trackerContext, {
    enabled: Boolean(user && data),
    playerOrigin: embedUrl ? originOf(embedUrl) : null,
  })

  if (!Number.isInteger(id) || id <= 0) return <NotFoundPage />

  const selectProvider = (next: string) => {
    setProviderId(next)
    writePreference('provider', next)
  }

  const toggleAdShield = () => {
    setAdShield((value) => {
      writePreference('adShield', value ? 'off' : 'on')
      return !value
    })
  }

  const goTo = (target: { season: number; episode: number } | null) => {
    if (target) void navigate(`/watch/tv/${id}/${target.season}/${target.episode}`)
  }

  const detailsPath = `/${mediaType}/${id}`

  return (
    <div className="mx-auto w-full max-w-[1800px] px-0 pt-16 sm:px-6 lg:px-10 lg:pt-24">
      <div className={clsx('grid gap-6', isTv && 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
        <div className="min-w-0 space-y-5">
          <div className="relative aspect-video w-full overflow-hidden bg-black shadow-2xl shadow-black/50 sm:rounded-3xl sm:ring-1 sm:ring-white/10">
            {embedUrl ? (
              <iframe
                key={frameKey}
                src={embedUrl}
                title={label ? `${title} ${label}` : title || 'Player'}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="origin"
                {...(adShield ? { sandbox: SANDBOX } : {})}
                onLoad={() => setLoadedFrame(frameKey)}
                className="absolute inset-0 size-full"
              />
            ) : providers.isError ? (
              <div className="absolute inset-0 grid place-items-center p-6">
                <ErrorState error={providers.error} onRetry={() => void providers.refetch()} />
              </div>
            ) : null}
            {(loading || providers.isPending) && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black">
                <div className="flex flex-col items-center gap-3 text-sm text-ink-300">
                  <Spinner className="size-8" />
                  {provider ? `Loading ${provider.name}` : 'Loading servers'}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-0">
            <div className="min-w-0">
              <Link
                to={detailsPath}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 transition hover:text-white"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to details
              </Link>
              {details.isPending ? (
                <div className="skeleton mt-2 h-8 w-64 rounded-lg" />
              ) : (
                <h1 className="mt-1.5 text-2xl font-bold text-white sm:text-3xl">
                  {title}{' '}
                  {label && <span className="text-gradient whitespace-nowrap">{label}</span>}
                </h1>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-300">
                {data && <RatingBadge value={data.vote_average} className="!bg-white/10" />}
                {episode?.name && <span className="font-medium text-ink-100">{episode.name}</span>}
                {data && <span>{yearOf(data)}</span>}
                {data && (
                  <span>
                    {formatRuntime(
                      isTv ? (episode?.runtime ?? data.episode_run_time?.[0]) : data.runtime,
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {isTv && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => goTo(navigation.prev)}
                    disabled={!navigation.prev}
                    aria-label="Previous episode"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Prev
                  </Button>
                  <Button
                    onClick={() => goTo(navigation.next)}
                    disabled={!navigation.next}
                    aria-label="Next episode"
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                onClick={() => setReloadKey((key) => key + 1)}
                aria-label="Reload player"
                title="Reload player"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
              </Button>
              {data && (
                <FavoriteButton
                  compact
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
              )}
            </div>
          </div>

          <div className="px-4 sm:px-0">
            {providers.isPending ? (
              <div className="skeleton h-56 rounded-3xl" />
            ) : (
              <ServerSelector
                providers={providerList}
                selected={provider?.id}
                onSelect={selectProvider}
                adShield={adShield}
                onToggleAdShield={toggleAdShield}
              />
            )}
          </div>

          {(episode?.overview || data?.overview) && (
            <div className="px-4 sm:px-0">
              <h2 className="text-lg font-bold text-white">
                {isTv && episode ? 'About this episode' : 'Overview'}
              </h2>
              <p className="mt-2 max-w-4xl leading-relaxed text-ink-300">
                {episode?.overview || data?.overview}
              </p>
            </div>
          )}

          {!user && (
            <div className="mx-4 flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-r from-brand-600/20 to-accent-500/10 p-5 ring-1 ring-brand-400/20 sm:mx-0 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-200">
                <strong className="text-white">Sign in</strong> to keep track of what you watch,
                resume where you left off and build your favorites.
              </p>
              <ButtonLink
                to="/login"
                state={{
                  from: `/watch/${mediaType}/${id}${isTv ? `/${seasonNumber}/${episodeNumber}` : ''}`,
                }}
                size="sm"
              >
                Sign in
              </ButtonLink>
            </div>
          )}
        </div>

        {isTv && (
          <aside className="mx-4 h-fit rounded-3xl border border-white/5 bg-ink-850/80 p-4 sm:mx-0 xl:sticky xl:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Episodes</h2>
              {seasons.length > 0 && (
                <SeasonSelect
                  seasons={seasons}
                  value={seasonNumber}
                  onChange={(value) => void navigate(`/watch/tv/${id}/${value}/1`)}
                  className="w-40"
                  compact
                />
              )}
            </div>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 xl:max-h-[calc(100vh-14rem)]">
              {season.isPending ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="skeleton h-[72px] rounded-xl" />
                  ))}
                </div>
              ) : season.isError ? (
                <ErrorState error={season.error} onRetry={() => void season.refetch()} />
              ) : (
                <EpisodeList
                  variant="compact"
                  tvId={id}
                  episodes={season.data.episodes}
                  progress={progress.data}
                  activeEpisode={episodeNumber}
                  activeSeason={seasonNumber}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
