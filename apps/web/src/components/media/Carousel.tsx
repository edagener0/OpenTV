import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

export function Carousel({ children, className }: { children: ReactNode; className?: string }) {
  const track = useRef<HTMLDivElement | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const node = track.current
    if (!node) return
    setCanPrev(node.scrollLeft > 8)
    setCanNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 8)
  }, [])

  useEffect(() => {
    const node = track.current
    if (!node) return
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    node.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      node.removeEventListener('scroll', update)
    }
  }, [update, children])

  const scroll = (direction: 1 | -1) => {
    const node = track.current
    if (!node) return
    node.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: 'smooth' })
  }

  const arrow =
    'absolute top-0 bottom-10 z-10 hidden w-14 items-center justify-center text-white opacity-0 transition duration-300 group-hover/carousel:opacity-100 md:flex'

  return (
    <div className={clsx('group/carousel relative', className)}>
      <div
        ref={track}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10"
      >
        {children}
      </div>
      {canPrev && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll(-1)}
          className={clsx(
            arrow,
            '-left-4 bg-gradient-to-r from-ink-900 to-transparent sm:-left-6 lg:-left-10',
          )}
        >
          <span className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/20">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </span>
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll(1)}
          className={clsx(
            arrow,
            '-right-4 bg-gradient-to-l from-ink-900 to-transparent sm:-right-6 lg:-right-10',
          )}
        >
          <span className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/20">
            <ChevronRight className="size-5" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  )
}
