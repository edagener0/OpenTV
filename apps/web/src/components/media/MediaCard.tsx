import clsx from 'clsx'
import { Play } from 'lucide-react'
import { Link } from 'react-router'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { type MediaSummary, type MediaType, mediaTypeOf, titleOf, yearOf } from '@/lib/tmdb'
import { Poster } from './Poster'

interface MediaCardProps {
  item: MediaSummary
  fallbackType?: MediaType
  className?: string
  showType?: boolean
}

export function MediaCard({ item, fallbackType, className, showType }: MediaCardProps) {
  const mediaType = mediaTypeOf(item, fallbackType)
  const title = titleOf(item)
  const year = yearOf(item)

  return (
    <Link
      to={`/${mediaType}/${item.id}`}
      className={clsx('group/card block outline-none', className)}
      aria-label={`${title}${year ? ` (${year})` : ''}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl ring-1 ring-white/5 transition duration-300 group-hover/card:-translate-y-1 group-hover/card:ring-brand-400/50 group-hover/card:shadow-2xl group-hover/card:shadow-brand-900/40 group-focus-visible/card:ring-2 group-focus-visible/card:ring-brand-400">
        <Poster
          path={item.poster_path}
          alt={title}
          className="size-full transition duration-500 group-hover/card:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 transition duration-300 group-hover/card:opacity-100" />
        <div className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover/card:opacity-100">
          <span className="grid size-12 scale-75 place-items-center rounded-full bg-white/95 text-ink-900 shadow-xl transition duration-300 group-hover/card:scale-100">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
          </span>
        </div>
        <div className="absolute left-2 top-2 flex gap-1.5">
          <RatingBadge value={item.vote_average} />
        </div>
        {showType && (
          <span className="absolute right-2 top-2 rounded-md bg-brand-600/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {mediaType === 'tv' ? 'TV' : 'Movie'}
          </span>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="truncate text-sm font-semibold text-ink-100 transition group-hover/card:text-white">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-ink-400">
          {[year, mediaType === 'tv' ? 'Series' : 'Movie'].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  )
}

export function MediaCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="skeleton aspect-[2/3] rounded-2xl" />
      <div className="skeleton mt-2.5 h-3.5 w-3/4 rounded" />
      <div className="skeleton mt-1.5 h-3 w-1/3 rounded" />
    </div>
  )
}
