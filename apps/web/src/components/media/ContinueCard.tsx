import { Play, X } from 'lucide-react'
import { Link } from 'react-router'
import { episodeLabel, formatRelative } from '@/lib/format'
import type { ProgressEntry } from '@/lib/library'
import { progressWatchPath } from '@/lib/paths'
import { imageUrl } from '@/lib/tmdb'

interface ContinueCardProps {
  entry: ProgressEntry
  onRemove?: (entry: ProgressEntry) => void
  className?: string
}

export function ContinueCard({ entry, onRemove, className }: ContinueCardProps) {
  const image = imageUrl(entry.backdropPath ?? entry.posterPath, 'w780')
  const label = episodeLabel(entry.season, entry.episode)
  const percent = Math.round(Math.max(entry.progress, entry.completed ? 1 : 0.02) * 100)

  return (
    <div className={className}>
      <div className="group/continue relative aspect-video overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-white/5 transition hover:ring-brand-400/50">
        <Link
          to={progressWatchPath(entry)}
          className="absolute inset-0"
          aria-label={`Resume ${entry.title}`}
        >
          {image && (
            <img
              src={image}
              alt=""
              loading="lazy"
              className="size-full object-cover transition duration-500 group-hover/continue:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover/continue:opacity-100">
            <span className="grid size-12 place-items-center rounded-full bg-white/95 text-ink-900 shadow-xl">
              <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <h3 className="truncate text-sm font-semibold text-white">{entry.title}</h3>
            <p className="mt-0.5 truncate text-xs text-ink-300">
              {[label, entry.episodeTitle, formatRelative(entry.updatedAt)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </Link>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(entry)}
            aria-label={`Remove ${entry.title} from history`}
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/80 sm:opacity-0 sm:group-hover/continue:opacity-100"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
