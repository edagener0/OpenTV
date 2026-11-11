import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { type HeartbeatPayload, libraryApi, libraryKeys } from '@/lib/library'
import { parsePlayerMessage, type PlayerProgress } from '@/lib/providers'

const TICK_MS = 30_000
const MAX_DELTA_SECONDS = 120

type TrackerContext = Omit<HeartbeatPayload, 'seconds' | 'position' | 'duration'>

export function useWatchTracker(
  context: TrackerContext | null,
  options: { enabled: boolean; playerOrigin: string | null },
) {
  const queryClient = useQueryClient()
  const contextRef = useRef(context)
  const progressRef = useRef<PlayerProgress | null>(null)
  const { enabled, playerOrigin } = options
  const identity = context
    ? `${context.mediaType}:${context.tmdbId}:${context.season ?? 0}:${context.episode ?? 0}`
    : null

  useEffect(() => {
    contextRef.current = context
  })

  useEffect(() => {
    if (!playerOrigin) return
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== playerOrigin) return
      const progress = parsePlayerMessage(event.data)
      if (progress) progressRef.current = progress
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [playerOrigin])

  useEffect(() => {
    if (!enabled || !identity) return
    progressRef.current = null
    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null
    let disposed = false

    const send = (seconds: number): Promise<void> => {
      const current = contextRef.current
      if (!current) return Promise.resolve()
      const progress = progressRef.current
      return libraryApi
        .heartbeat({
          ...current,
          seconds: Math.min(MAX_DELTA_SECONDS, Math.max(0, Math.round(seconds))),
          ...(progress ? { position: progress.position, duration: progress.duration } : {}),
        })
        .then(() => {
          if (disposed) return
          void queryClient.invalidateQueries({ queryKey: libraryKeys.continue })
        })
        .catch(() => undefined)
    }

    const flush = (): Promise<void> => {
      if (visibleSince === null) return Promise.resolve()
      const now = Date.now()
      const elapsed = (now - visibleSince) / 1000
      visibleSince = now
      return elapsed >= 1 ? send(elapsed) : Promise.resolve()
    }

    void send(0)

    const interval = window.setInterval(() => void flush(), TICK_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flush()
        visibleSince = null
      } else {
        visibleSince = Date.now()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      void flush().finally(() => queryClient.invalidateQueries({ queryKey: libraryKeys.all }))
    }
  }, [enabled, identity, queryClient])
}
