import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Clapperboard,
  Clock,
  Flame,
  Heart,
  KeyRound,
  LogOut,
  type LucideIcon,
  Trash2,
  Tv,
  UserX,
} from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { PageContainer } from '@/components/layout/AppLayout'
import { Avatar } from '@/components/layout/UserMenu'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Field } from '@/components/ui/Field'
import { PageSpinner } from '@/components/ui/Spinner'
import { sessionKey, useAuthActions, useSession } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { errorMessage } from '@/lib/api'
import { formatDate, formatWatchTime } from '@/lib/format'
import { libraryApi, libraryKeys, type Stats } from '@/lib/library'
import { imageUrl } from '@/lib/tmdb'

function Card({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-3xl border border-white/5 bg-ink-850/80 p-5 sm:p-6 ${className ?? ''}`}
    >
      {title && <h2 className="mb-5 text-lg font-bold text-white">{title}</h2>}
      {children}
    </section>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-850/80 p-5">
      <div className="flex items-center gap-2 text-sm text-ink-400">
        <Icon className="size-4 text-brand-300" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

const shortDay = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function ActivityChart({ activity }: { activity: Stats['activity'] }) {
  const max = Math.max(...activity.map((day) => day.seconds), 1)
  const total = activity.reduce((sum, day) => sum + day.seconds, 0)
  const activeDays = activity.filter((day) => day.seconds > 0).length
  const first = activity[0]
  const last = activity.at(-1)

  return (
    <Card title="Watch time, last 30 days">
      <p className="-mt-3 mb-5 text-sm text-ink-400">
        {formatWatchTime(total)} across {activeDays} active day{activeDays === 1 ? '' : 's'}
      </p>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-white/5" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-white/5" />
        <div className="flex h-44 items-end gap-[2px]" aria-hidden="true">
          {activity.map((day) => {
            const height = day.seconds > 0 ? Math.max(4, (day.seconds / max) * 100) : 0
            return (
              <div key={day.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="absolute inset-0 rounded-t transition group-hover:bg-white/[0.04]" />
                <div
                  className="relative w-full rounded-t-[4px] bg-brand-500 transition group-hover:bg-brand-400"
                  style={{ height: `${height}%` }}
                />
                {day.seconds === 0 && (
                  <div className="relative h-[2px] w-full rounded-full bg-white/5" />
                )}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-ink-750 px-2.5 py-1.5 text-xs shadow-xl group-hover:block">
                  <span className="block font-semibold text-white">
                    {formatWatchTime(day.seconds)}
                  </span>
                  <span className="text-ink-400">{shortDay.format(new Date(day.day))}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-400">
          <span>{first ? shortDay.format(new Date(first.day)) : ''}</span>
          <span>Peak {formatWatchTime(max === 1 ? 0 : max)}</span>
          <span>{last ? shortDay.format(new Date(last.day)) : ''}</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Watch time per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Watch time</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((day) => (
            <tr key={day.day}>
              <td>{day.day}</td>
              <td>{formatWatchTime(day.seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function GenreBreakdown({ genres }: { genres: Stats['topGenres'] }) {
  const max = Math.max(...genres.map((genre) => genre.seconds), 1)
  return (
    <Card title="Top genres">
      {genres.length === 0 ? (
        <p className="text-sm text-ink-400">Watch a few titles to see your taste profile.</p>
      ) : (
        <ul className="space-y-4">
          {genres.map((genre) => (
            <li key={genre.name}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-ink-100">{genre.name}</span>
                <span className="text-ink-400">{formatWatchTime(genre.seconds)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.max(3, (genre.seconds / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function TopTitles({ titles }: { titles: Stats['topTitles'] }) {
  return (
    <Card title="Most watched">
      {titles.length === 0 ? (
        <p className="text-sm text-ink-400">
          Nothing yet. Your most watched titles will appear here.
        </p>
      ) : (
        <ol className="space-y-3">
          {titles.map((title, index) => (
            <li key={`${title.mediaType}-${title.tmdbId}`}>
              <Link
                to={`/${title.mediaType}/${title.tmdbId}`}
                className="flex items-center gap-4 rounded-xl p-1.5 transition hover:bg-white/5"
              >
                <span className="w-5 text-center font-display text-lg font-bold text-ink-500">
                  {index + 1}
                </span>
                <div className="aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-md bg-ink-800">
                  {title.posterPath && (
                    <img
                      src={imageUrl(title.posterPath, 'w92') ?? ''}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{title.title}</p>
                  <p className="text-xs text-ink-400">
                    {title.mediaType === 'tv' ? 'Series' : 'Movie'} ·{' '}
                    {formatWatchTime(title.seconds)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function ChangePassword() {
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const mutation = useMutation({
    mutationFn: () => libraryApi.changePassword(current, next),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setMessage({ kind: 'ok', text: 'Password updated. Other devices have been signed out.' })
      void queryClient.invalidateQueries({ queryKey: sessionKey })
    },
    onError: (error) => setMessage({ kind: 'error', text: errorMessage(error) }),
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (next.length < 8) {
      setMessage({ kind: 'error', text: 'New password needs at least 8 characters.' })
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <KeyRound className="size-4 text-brand-300" aria-hidden="true" />
        Change password
      </div>
      <Field
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
      />
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(event) => setNext(event.target.value)}
      />
      {message && (
        <p
          role="status"
          className={message.kind === 'ok' ? 'text-sm text-emerald-300' : 'text-sm text-red-300'}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending || !current || !next}>
        Update password
      </Button>
    </form>
  )
}

function DangerZone() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuthActions()
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const remove = useMutation({
    mutationFn: () => libraryApi.deleteAccount(password),
    onSuccess: () => {
      queryClient.setQueryData(sessionKey, null)
      queryClient.removeQueries({ queryKey: libraryKeys.all })
      void navigate('/', { replace: true })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => logout.mutate(true, { onSettled: () => void navigate('/') })}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out everywhere
        </Button>
        {!confirming && (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <UserX className="size-4" aria-hidden="true" />
            Delete account
          </Button>
        )}
      </div>
      {confirming && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            remove.mutate()
          }}
          className="space-y-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"
        >
          <p className="text-sm text-red-200">
            This permanently deletes your account, favorites and watch history. Enter your password
            to confirm.
          </p>
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {remove.isError && <p className="text-sm text-red-300">{errorMessage(remove.error)}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!password || remove.isPending}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete forever
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export function AccountPage() {
  useDocumentTitle('Stats & account')
  const session = useSession()
  const user = session.data
  const stats = useQuery({
    queryKey: libraryKeys.stats,
    queryFn: libraryApi.stats,
    enabled: Boolean(user),
  })

  if (session.isPending) return <PageSpinner />
  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />

  return (
    <PageContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_65%)]" />
      <header className="flex flex-wrap items-center gap-5">
        <Avatar
          name={user.username}
          className="size-16 text-2xl shadow-xl shadow-brand-900/50 sm:size-20 sm:text-3xl"
        />
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{user.username}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
            <CalendarDays className="size-4" aria-hidden="true" />
            Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </header>

      {stats.isPending ? (
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : stats.isError ? (
        <div className="mt-10">
          <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <StatTile
                icon={Clock}
                label="Total watch time"
                value={formatWatchTime(stats.data.totalSeconds)}
                hint={`${plural(stats.data.completed, 'title')} finished`}
              />
            </div>
            <StatTile icon={Clapperboard} label="Movies" value={String(stats.data.moviesWatched)} />
            <StatTile
              icon={Tv}
              label="Series"
              value={String(stats.data.showsWatched)}
              hint={plural(stats.data.episodesWatched, 'episode')}
            />
            <StatTile icon={Flame} label="Day streak" value={String(stats.data.streak)} />
            <StatTile
              icon={Heart}
              label="Favorites"
              value={String(stats.data.favorites.movies + stats.data.favorites.shows)}
              hint={`${plural(stats.data.favorites.movies, 'movie')} · ${stats.data.favorites.shows} series`}
            />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <ActivityChart activity={stats.data.activity} />
            <GenreBreakdown genres={stats.data.topGenres} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <TopTitles titles={stats.data.topTitles} />
            <Card title="Account">
              <div className="space-y-8">
                <ChangePassword />
                <div className="h-px bg-white/5" />
                <DangerZone />
              </div>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  )
}
