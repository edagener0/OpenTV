import { useQuery } from '@tanstack/react-query'
import { useUser } from './useAuth'
import { libraryApi, libraryKeys } from '@/lib/library'
import {
  DETAILS_APPEND,
  type MediaDetails,
  type MediaType,
  type SeasonDetails,
  tmdb,
} from '@/lib/tmdb'

export function useMediaDetails(mediaType: MediaType, id: number) {
  return useQuery({
    queryKey: ['tmdb', mediaType, id, 'details'],
    queryFn: ({ signal }) =>
      tmdb<MediaDetails>(
        `${mediaType}/${id}`,
        { append_to_response: DETAILS_APPEND[mediaType] },
        signal,
      ),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 60 * 1000,
  })
}

export function useSeason(id: number, season: number | null) {
  return useQuery({
    queryKey: ['tmdb', 'tv', id, 'season', season],
    queryFn: ({ signal }) => tmdb<SeasonDetails>(`tv/${id}/season/${season}`, {}, signal),
    enabled: season !== null && Number.isInteger(id) && id > 0,
    staleTime: 30 * 60 * 1000,
  })
}

export function useTitleProgress(mediaType: MediaType, id: number) {
  const user = useUser()
  return useQuery({
    queryKey: libraryKeys.title(mediaType, id),
    queryFn: () => libraryApi.titleProgress(mediaType, id),
    enabled: Boolean(user) && id > 0,
  })
}
