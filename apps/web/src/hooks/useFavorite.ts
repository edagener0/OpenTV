import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FavoritePayload, libraryApi, libraryKeys } from '@/lib/library'
import type { MediaType } from '@/lib/tmdb'
import { useUser } from './useAuth'

export function useFavorite(mediaType: MediaType, tmdbId: number) {
  const user = useUser()
  const queryClient = useQueryClient()
  const key = libraryKeys.favorite(mediaType, tmdbId)

  const status = useQuery({
    queryKey: key,
    queryFn: () => libraryApi.isFavorite(mediaType, tmdbId),
    enabled: Boolean(user),
  })

  const toggle = useMutation({
    mutationFn: async ({ next, payload }: { next: boolean; payload: FavoritePayload }) => {
      if (next) await libraryApi.addFavorite(mediaType, tmdbId, payload)
      else await libraryApi.removeFavorite(mediaType, tmdbId)
      return next
    },
    onMutate: async ({ next }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<boolean>(key)
      queryClient.setQueryData(key, next)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous ?? false)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: libraryKeys.favorites })
      void queryClient.invalidateQueries({ queryKey: libraryKeys.stats })
    },
  })

  return {
    isFavorite: status.data ?? false,
    isSignedIn: Boolean(user),
    isPending: toggle.isPending,
    toggle: (payload: FavoritePayload) => toggle.mutate({ next: !(status.data ?? false), payload }),
  }
}
