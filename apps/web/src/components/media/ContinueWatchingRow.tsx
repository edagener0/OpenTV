import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useUser } from '@/hooks/useAuth'
import { libraryApi, libraryKeys, type ProgressEntry } from '@/lib/library'
import { Carousel } from './Carousel'
import { ContinueCard } from './ContinueCard'

export function ContinueWatchingRow() {
  const user = useUser()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: libraryKeys.continue,
    queryFn: libraryApi.continueWatching,
    enabled: Boolean(user),
  })
  const remove = useMutation({
    mutationFn: (entry: ProgressEntry) => libraryApi.removeTitle(entry.mediaType, entry.tmdbId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: libraryKeys.all }),
  })

  if (!user || !query.data || query.data.length === 0) return null

  return (
    <section className="animate-rise">
      <SectionHeader title="Continue watching" to="/library" />
      <Carousel>
        {query.data.map((entry) => (
          <ContinueCard
            key={`${entry.mediaType}-${entry.tmdbId}`}
            entry={entry}
            onRemove={(item) => remove.mutate(item)}
            className="w-[78vw] shrink-0 snap-start sm:w-80 lg:w-96"
          />
        ))}
      </Carousel>
    </section>
  )
}
