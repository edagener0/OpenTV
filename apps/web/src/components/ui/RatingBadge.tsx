import clsx from 'clsx'
import { Star } from 'lucide-react'
import { formatRating } from '@/lib/format'

export function RatingBadge({ value, className }: { value?: number | null; className?: string }) {
  const rating = formatRating(value)
  if (!rating) return null
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm',
        className,
      )}
    >
      <Star className="size-3 fill-current" aria-hidden="true" />
      {rating}
    </span>
  )
}
