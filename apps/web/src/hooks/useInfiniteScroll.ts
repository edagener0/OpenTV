import { useEffect, useRef } from 'react'

export function useInfiniteScroll(onReachEnd: () => void, enabled: boolean) {
  const sentinel = useRef<HTMLDivElement | null>(null)
  const callback = useRef(onReachEnd)

  useEffect(() => {
    callback.current = onReachEnd
  }, [onReachEnd])

  useEffect(() => {
    const node = sentinel.current
    if (!node || !enabled) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current()
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled])

  return sentinel
}
