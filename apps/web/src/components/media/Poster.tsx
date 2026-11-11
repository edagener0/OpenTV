import clsx from 'clsx'
import { Film } from 'lucide-react'
import { useState } from 'react'
import { type ImageSize, imageUrl } from '@/lib/tmdb'

interface PosterProps {
  path: string | null | undefined
  alt: string
  size?: ImageSize
  className?: string
  eager?: boolean
}

export function Poster({ path, alt, size = 'w342', className, eager }: PosterProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const src = imageUrl(path, size)

  return (
    <div className={clsx('relative overflow-hidden bg-ink-800', !loaded && 'skeleton', className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={clsx(
            'size-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-750 to-ink-850 p-3 text-center">
          <div className="flex flex-col items-center gap-2 text-ink-400">
            <Film className="size-7" aria-hidden="true" />
            <span className="line-clamp-3 text-xs font-medium">{alt}</span>
          </div>
        </div>
      )}
    </div>
  )
}
