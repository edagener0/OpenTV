import clsx from 'clsx'
import { BarChart3, Library, LogOut, Server } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { useAuthActions, useUser } from '@/hooks/useAuth'
import { useClickOutside } from '@/hooks/useClickOutside'
import { isTauri } from '@/lib/platform'

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={clsx(
        'grid place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-display font-bold uppercase text-white',
        className,
      )}
      aria-hidden="true"
    >
      {name.slice(0, 1)}
    </span>
  )
}

export function UserMenu() {
  const user = useUser()
  const { logout } = useAuthActions()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement | null>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(container, close, open)

  if (!user) {
    return (
      <ButtonLink to="/login" size="sm" className="px-4">
        Sign in
      </ButtonLink>
    )
  }

  const item =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-200 transition hover:bg-white/5 hover:text-white'

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="rounded-full ring-2 ring-transparent transition hover:ring-brand-400/50"
      >
        <Avatar name={user.username} className="size-9 text-sm" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 w-60 origin-top-right rounded-2xl border border-white/10 bg-ink-850/95 p-2 shadow-2xl backdrop-blur-xl animate-rise"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={user.username} className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.username}</p>
              <p className="text-xs text-ink-400">Signed in</p>
            </div>
          </div>
          <div className="my-1.5 h-px bg-white/5" />
          <Link to="/account" role="menuitem" className={item} onClick={close}>
            <BarChart3 className="size-4" aria-hidden="true" />
            Stats &amp; account
          </Link>
          <Link to="/library" role="menuitem" className={item} onClick={close}>
            <Library className="size-4" aria-hidden="true" />
            My library
          </Link>
          {isTauri && (
            <Link to="/setup" role="menuitem" className={item} onClick={close}>
              <Server className="size-4" aria-hidden="true" />
              Server settings
            </Link>
          )}
          <div className="my-1.5 h-px bg-white/5" />
          <button
            type="button"
            role="menuitem"
            className={clsx(item, 'text-red-300 hover:text-red-200')}
            onClick={() => {
              close()
              logout.mutate(false, { onSettled: () => void navigate('/') })
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
