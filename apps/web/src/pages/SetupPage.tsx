import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, ChevronRight, Server, X } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Logo } from '@/components/ui/Logo'
import { Spinner } from '@/components/ui/Spinner'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { probeServer } from '@/lib/api'
import {
  forgetServer,
  getRecentServers,
  getServerUrl,
  normalizeServerUrl,
  serverLabel,
  setServerUrl,
} from '@/lib/platform'

export function SetupPage() {
  useDocumentTitle('Connect to a server')
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const current = getServerUrl()
  const from = (location.state as { from?: string } | null)?.from
  const [value, setValue] = useState('')
  const [recent, setRecent] = useState(getRecentServers)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<{ url: string; fromForm: boolean } | null>(null)

  const connect = async (url: string, fromForm: boolean) => {
    setError(null)
    if (url === current) {
      void navigate(from ?? '/', { replace: true })
      return
    }
    setPending({ url, fromForm })
    const ok = await probeServer(url)
    setPending(null)
    if (!ok) {
      setError(`Could not reach an OpenTV server at ${serverLabel(url)}.`)
      return
    }
    setServerUrl(url)
    queryClient.clear()
    void navigate('/', { replace: true })
  }

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    let url: string
    try {
      url = normalizeServerUrl(value)
    } catch {
      setError('Enter a valid address such as https://tv.example.com or 192.168.1.10:8080')
      return
    }
    void connect(url, true)
  }

  const cancel = () => {
    if (from) void navigate(from, { replace: true })
    else if (location.key !== 'default') void navigate(-1)
    else void navigate('/', { replace: true })
  }

  const busy = pending !== null

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_60%)]" />
      <div className="relative w-full max-w-md animate-rise">
        <Logo className="mx-auto mb-8 w-fit scale-110" />
        <div className="rounded-3xl border border-white/10 bg-ink-850/80 p-7 shadow-2xl backdrop-blur-2xl sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25">
            <Server className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-white">
            {current ? 'Switch server' : 'Connect to your server'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-400">
            {current
              ? 'Pick a saved server or enter a new address. Each server keeps its own account and library.'
              : 'Enter the address of the OpenTV server you or a friend host with Docker.'}
          </p>

          {recent.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Saved servers
              </h2>
              <ul className="mt-3 space-y-2">
                {recent.map((url) => {
                  const active = url === current
                  return (
                    <li key={url} className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void connect(url, false)}
                        aria-current={active ? 'true' : undefined}
                        className={clsx(
                          'flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition disabled:opacity-60',
                          active
                            ? 'bg-brand-500/15 ring-brand-400/40'
                            : 'bg-ink-800 ring-white/5 hover:bg-ink-750 hover:ring-white/15',
                        )}
                      >
                        <span
                          className={clsx(
                            'size-2 shrink-0 rounded-full',
                            active ? 'bg-emerald-400' : 'bg-ink-500',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">
                            {serverLabel(url)}
                          </span>
                          <span className="block text-xs text-ink-400">
                            {active ? 'Connected' : url.startsWith('https://') ? 'HTTPS' : 'HTTP'}
                          </span>
                        </span>
                        {pending?.url === url && !pending.fromForm ? (
                          <Spinner className="size-4" />
                        ) : active ? (
                          <Check className="size-4 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="size-4 text-ink-400" aria-hidden="true" />
                        )}
                      </button>
                      {!active && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setRecent(forgetServer(url))}
                          aria-label={`Forget ${serverLabel(url)}`}
                          className="grid size-10 shrink-0 place-items-center rounded-xl text-ink-400 transition hover:bg-white/5 hover:text-white"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6">
            <Field
              label={recent.length > 0 ? 'Add a server' : 'Server address'}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https://tv.example.com"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={recent.length === 0}
            />
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={busy || !value.trim()}
            >
              {pending?.fromForm && <Spinner className="size-4 border-white/30 border-t-white" />}
              Connect
            </Button>
          </form>
          {current && (
            <Button variant="ghost" className="mt-2 w-full" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
