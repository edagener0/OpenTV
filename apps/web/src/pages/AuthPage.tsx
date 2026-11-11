import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { ChangeServerLink } from '@/components/layout/ServerSwitch'
import { Logo } from '@/components/ui/Logo'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthActions, useUser } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { errorMessage } from '@/lib/api'
import { useServerInfo } from '@/hooks/useServer'
import { imageUrl, type MediaSummary, type Paged, tmdb, tmdbKeys } from '@/lib/tmdb'

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/

function PosterBackdrop() {
  const query = useQuery({
    queryKey: tmdbKeys.list('trending/all/week'),
    queryFn: ({ signal }) => tmdb<Paged<MediaSummary>>('trending/all/week', {}, signal),
    staleTime: 10 * 60 * 1000,
  })
  const posters = (query.data?.results ?? []).filter((item) => item.poster_path).slice(0, 18)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -inset-20 grid rotate-[-8deg] grid-cols-4 gap-4 opacity-40 sm:grid-cols-6">
        {posters.map((item) => (
          <img
            key={item.id}
            src={imageUrl(item.poster_path, 'w342') ?? ''}
            alt=""
            className="aspect-[2/3] w-full rounded-xl object-cover animate-fade-in"
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/80 via-ink-900/90 to-ink-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.18),transparent_60%)]" />
    </div>
  )
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'
  useDocumentTitle(isLogin ? 'Sign in' : 'Create account')
  const user = useUser()
  const info = useServerInfo()
  const { login, register } = useAuthActions()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = isLogin ? login : register
  const registrationDisabled = !isLogin && info.data && !info.data.registrationEnabled

  if (user) return <Navigate to={from} replace />

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    setLocalError(null)
    const name = username.trim()
    if (!isLogin) {
      if (!USERNAME_PATTERN.test(name)) {
        setLocalError(
          'Usernames are 3 to 32 characters: letters, numbers, dots, dashes or underscores.',
        )
        return
      }
      if (password.length < 8) {
        setLocalError('Passwords need at least 8 characters.')
        return
      }
      if (password !== confirm) {
        setLocalError('Passwords do not match.')
        return
      }
    }
    mutation.mutate(
      { username: name, password },
      { onSuccess: () => void navigate(from, { replace: true }) },
    )
  }

  const error = localError ?? (mutation.isError ? errorMessage(mutation.error) : null)

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-16">
      <PosterBackdrop />
      <div className="relative w-full max-w-md animate-rise">
        <Link to="/" className="mx-auto mb-8 flex w-fit" aria-label="OpenTV home">
          <Logo className="scale-110" />
        </Link>
        <div className="rounded-3xl border border-white/10 bg-ink-850/80 p-7 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-9">
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-400">
            {isLogin
              ? 'Sign in to pick up right where you left off.'
              : 'Track what you watch, save favorites and see your stats.'}
          </p>

          {registrationDisabled ? (
            <p className="mt-6 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-400/20">
              Registration is disabled on this server. Ask the administrator for an account.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
              <Field
                label="Username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your-name"
                {...(!isLogin ? { hint: 'Letters, numbers, dots, dashes and underscores.' } : {})}
              />
              <div className="relative">
                <Field
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute bottom-1 right-1 grid size-10 place-items-center rounded-lg text-ink-400 transition hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {!isLogin && (
                <Field
                  label="Confirm password"
                  name="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="••••••••"
                />
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20"
                >
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Spinner className="size-4 border-white/30 border-t-white" />
                )}
                {isLogin ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-ink-400">
            {isLogin ? 'New here? ' : 'Already have an account? '}
            <Link
              to={isLogin ? '/register' : '/login'}
              state={location.state}
              className="font-semibold text-brand-300 transition hover:text-brand-200"
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          No email needed. Just a username and a password.
        </p>
        <ChangeServerLink className="mt-3 text-center" />
      </div>
    </div>
  )
}
