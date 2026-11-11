import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { libraryApi } from '@/lib/library'
import type { Provider } from '@/lib/providers'

export function useServerInfo() {
  return useQuery({
    queryKey: ['server-info'],
    queryFn: libraryApi.serverInfo,
    staleTime: 10 * 60 * 1000,
  })
}

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => api<{ providers: Provider[] }>('/providers').then((body) => body.providers),
    staleTime: 10 * 60 * 1000,
  })
}
