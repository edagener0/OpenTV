import { useQuery } from '@tanstack/react-query'
import { type Genre, type MediaType, tmdb } from '@/lib/tmdb'

export function useGenres(mediaType: MediaType) {
  return useQuery({
    queryKey: ['tmdb', 'genres', mediaType],
    queryFn: ({ signal }) =>
      tmdb<{ genres: Genre[] }>(`genre/${mediaType}/list`, {}, signal).then((body) => body.genres),
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useGenreLookup() {
  const movie = useGenres('movie')
  const tv = useGenres('tv')
  const lookup = new Map<number, string>()
  for (const genre of [...(movie.data ?? []), ...(tv.data ?? [])]) lookup.set(genre.id, genre.name)
  return lookup
}
