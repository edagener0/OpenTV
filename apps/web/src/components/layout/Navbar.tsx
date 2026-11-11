import clsx from 'clsx'
import { Search } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { UserMenu } from './UserMenu'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies', end: false },
  { to: '/tv', label: 'TV Shows', end: false },
  { to: '/library', label: 'My Library', end: false },
] as const

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (value) void navigate(`/search?q=${encodeURIComponent(value)}`)
  }

  const onSearchPage = location.pathname === '/search'

  return (
    <header
      className={clsx(
        'pt-safe fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass border-b border-white/5 shadow-lg shadow-black/20'
          : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1800px] items-center gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-10">
        <Link to="/" aria-label="OpenTV home" className="shrink-0">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  clsx(
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive ? 'text-white' : 'text-ink-300 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-accent-500" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-3">
          {!onSearchPage && (
            <form onSubmit={onSubmit} role="search" className="relative hidden sm:block">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search movies & shows"
                aria-label="Search movies and shows"
                className="h-10 w-56 rounded-full border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-ink-400 backdrop-blur-md transition-all focus:w-72 focus:border-brand-500/50 focus:bg-ink-850/90 focus:outline-none lg:w-64 lg:focus:w-80"
              />
            </form>
          )}
          <Link
            to="/search"
            aria-label="Search"
            className="grid size-10 place-items-center rounded-full text-ink-200 transition hover:bg-white/10 hover:text-white sm:hidden"
          >
            <Search className="size-5" aria-hidden="true" />
          </Link>
          <UserMenu />
        </div>
      </nav>
    </header>
  )
}
