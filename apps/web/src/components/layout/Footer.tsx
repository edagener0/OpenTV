import { Link } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { ChangeServerLink } from './ServerSwitch'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-ink-950/60">
      <div className="mx-auto grid max-w-[1800px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-400">
            OpenTV is a self-hosted, open source hub for discovering movies and TV shows. It does
            not host any media. All streams are provided by third-party services configured by the
            server administrator.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Browse</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
            <li>
              <Link className="transition hover:text-white" to="/movies">
                Movies
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" to="/tv">
                TV Shows
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" to="/search">
                Search
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">You</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
            <li>
              <Link className="transition hover:text-white" to="/library">
                Library
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" to="/account">
                Stats &amp; account
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p className="text-xs text-ink-500">
            Metadata and images provided by TMDB. This product uses the TMDB API but is not endorsed
            or certified by TMDB.
          </p>
          <ChangeServerLink className="shrink-0" />
        </div>
      </div>
    </footer>
  )
}
