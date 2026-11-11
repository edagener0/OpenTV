import clsx from 'clsx'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={clsx('shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id="opentv-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#opentv-logo)" />
      <rect x="12" y="17" width="40" height="28" rx="6" fill="none" stroke="#fff" strokeWidth="4" />
      <path d="M28 25.5v11l9-5.5z" fill="#fff" />
      <path d="M24 51h16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('flex items-center gap-2.5', className)}>
      <LogoMark className="size-8" />
      <span className="font-display text-xl font-bold tracking-tight text-white">
        Open<span className="text-gradient">TV</span>
      </span>
    </span>
  )
}
