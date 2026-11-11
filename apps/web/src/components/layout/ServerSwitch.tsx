import clsx from 'clsx'
import { Server } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { getServerUrl, isTauri, serverLabel } from '@/lib/platform'

function useServerTarget() {
  const location = useLocation()
  const current = getServerUrl()
  return {
    current: current ? serverLabel(current) : null,
    state: { from: `${location.pathname}${location.search}` },
  }
}

export function ServerSwitch({ className }: { className?: string }) {
  const { current, state } = useServerTarget()
  if (!isTauri) return null
  return (
    <Link
      to="/setup"
      state={state}
      title={current ? `Connected to ${current}. Change server` : 'Choose a server'}
      aria-label={current ? `Connected to ${current}. Change server` : 'Choose a server'}
      className={clsx(
        'flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm font-medium text-ink-200 backdrop-blur-md transition hover:border-brand-400/40 hover:bg-white/10 hover:text-white',
        className,
      )}
    >
      <span className="relative grid place-items-center">
        <Server className="size-4" aria-hidden="true" />
        <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="hidden max-w-36 truncate lg:inline">{current ?? 'Server'}</span>
    </Link>
  )
}

export function ChangeServerLink({ className }: { className?: string }) {
  const { current, state } = useServerTarget()
  if (!isTauri) return null
  return (
    <p className={clsx('text-xs text-ink-400', className)}>
      Connected to <span className="font-medium text-ink-200">{current ?? 'no server'}</span>
      {' · '}
      <Link
        to="/setup"
        state={state}
        className="font-semibold text-brand-300 transition hover:text-brand-200"
      >
        Change server
      </Link>
    </p>
  )
}
