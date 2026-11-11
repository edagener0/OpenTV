import { useQuery } from '@tanstack/react-query'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { type MediaSummary, type MediaType, type Paged, tmdb, tmdbKeys } from '@/lib/tmdb'
import { Carousel } from './Carousel'
import { MediaCard, MediaCardSkeleton } from './MediaCard'

const itemClass = 'w-[38vw] shrink-0 snap-start sm:w-44 lg:w-48 xl:w-52'

interface MediaRowProps {
  title: string
  path: string
  params?: Record<string, string | number | undefined>
  fallbackType?: MediaType
  to?: string
  showType?: boolean
}

export function MediaRow({ title, path, params, fallbackType, to, showType }: MediaRowProps) {
  const query = useQuery({
    queryKey: tmdbKeys.list(path, params),
    queryFn: ({ signal }) => tmdb<Paged<MediaSummary>>(path, params, signal),
    staleTime: 10 * 60 * 1000,
  })

  if (query.isError) return null
  const items = (query.data?.results ?? []).filter(
    (item) => item.media_type !== 'person' && item.poster_path,
  )
  if (query.isSuccess && items.length === 0) return null

  return (
    <section className="animate-rise">
      <SectionHeader title={title} {...(to ? { to } : {})} />
      <Carousel>
        {query.isPending
          ? Array.from({ length: 8 }, (_, index) => (
              <MediaCardSkeleton key={index} className={itemClass} />
            ))
          : items.map((item) => (
              <MediaCard
                key={`${item.media_type ?? fallbackType}-${item.id}`}
                item={item}
                {...(fallbackType ? { fallbackType } : {})}
                {...(showType ? { showType } : {})}
                className={itemClass}
              />
            ))}
      </Carousel>
    </section>
  )
}

export function StaticMediaRow({
  title,
  items,
  fallbackType,
}: {
  title: string
  items: MediaSummary[]
  fallbackType?: MediaType
}) {
  const visible = items.filter((item) => item.poster_path)
  if (visible.length === 0) return null
  return (
    <section>
      <SectionHeader title={title} />
      <Carousel>
        {visible.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            {...(fallbackType ? { fallbackType } : {})}
            className={itemClass}
          />
        ))}
      </Carousel>
    </section>
  )
}
