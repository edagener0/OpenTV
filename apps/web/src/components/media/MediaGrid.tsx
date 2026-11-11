import type { MediaSummary, MediaType } from '@/lib/tmdb'
import { MediaCard, MediaCardSkeleton } from './MediaCard'

const gridClass =
  'grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'

interface MediaGridProps {
  items: MediaSummary[]
  fallbackType?: MediaType
  showType?: boolean
  loadingMore?: boolean
}

export function MediaGrid({ items, fallbackType, showType, loadingMore }: MediaGridProps) {
  return (
    <div className={gridClass}>
      {items.map((item) => (
        <MediaCard
          key={`${item.media_type ?? fallbackType}-${item.id}`}
          item={item}
          {...(fallbackType ? { fallbackType } : {})}
          {...(showType ? { showType } : {})}
        />
      ))}
      {loadingMore &&
        Array.from({ length: 6 }, (_, index) => <MediaCardSkeleton key={`s-${index}`} />)}
    </div>
  )
}

export function MediaGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, index) => (
        <MediaCardSkeleton key={index} />
      ))}
    </div>
  )
}
