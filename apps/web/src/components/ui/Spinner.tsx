import clsx from 'clsx'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        'inline-block size-5 animate-spin rounded-full border-2 border-white/20 border-t-brand-400',
        className,
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
