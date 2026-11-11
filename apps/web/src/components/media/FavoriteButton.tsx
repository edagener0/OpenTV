import clsx from 'clsx'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { useFavorite } from '@/hooks/useFavorite'
import type { FavoritePayload } from '@/lib/library'
import type { MediaType } from '@/lib/tmdb'

interface FavoriteButtonProps {
  mediaType: MediaType
  tmdbId: number
  payload: FavoritePayload
  compact?: boolean
}

export function FavoriteButton({ mediaType, tmdbId, payload, compact }: FavoriteButtonProps) {
  const navigate = useNavigate()
  const favorite = useFavorite(mediaType, tmdbId)
  const label = favorite.isFavorite ? 'Remove from favorites' : 'Add to favorites'

  const onClick = () => {
    if (!favorite.isSignedIn) {
      void navigate('/login', { state: { from: `/${mediaType}/${tmdbId}` } })
      return
    }
    favorite.toggle(payload)
  }

  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={onClick}
      aria-pressed={favorite.isFavorite}
      aria-label={label}
      title={label}
      className={clsx(
        compact && 'w-12 px-0',
        favorite.isFavorite && '!bg-accent-500/20 !ring-accent-500/40',
      )}
    >
      <Heart
        className={clsx(
          'size-5 transition',
          favorite.isFavorite ? 'scale-110 fill-accent-500 text-accent-500' : 'text-white',
        )}
        aria-hidden="true"
      />
      {!compact && (favorite.isFavorite ? 'Favorited' : 'Favorite')}
    </Button>
  )
}
