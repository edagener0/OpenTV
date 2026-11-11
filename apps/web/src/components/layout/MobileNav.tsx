import clsx from 'clsx'
import { Clapperboard, Home, Library, Search, Tv } from 'lucide-react'
import { NavLink } from 'react-router'

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/movies', label: 'Movies', icon: Clapperboard, end: false },
  { to: '/tv', label: 'TV', icon: Tv, end: false },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/library', label: 'Library', icon: Library, end: false },
] as const

export function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="glass pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/5 md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition',
                  isActive ? 'text-white' : 'text-ink-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx('size-5 transition', isActive && 'text-brand-400')}
                    aria-hidden="true"
                  />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
