import { useQueryClient } from '@tanstack/react-query'
import { Server } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Logo } from '@/components/ui/Logo'
import { Spinner } from '@/components/ui/Spinner'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { probeServer } from '@/lib/api'
import { getServerUrl, normalizeServerUrl, setServerUrl } from '@/lib/platform'

export function SetupPage() {
  useDocumentTitle('Connect to a server')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const current = getServerUrl()
  const [value, setValue] = useState(current ?? '')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    let url: string
    try {
      url = normalizeServerUrl(value)
    } catch {
      setError('Enter a valid address such as https://tv.example.com or 192.168.1.10:8080')
      return
    }
    setChecking(true)
    const ok = await probeServer(url)
    setChecking(false)
    if (!ok) {
      setError('Could not reach an OpenTV server at that address.')
      return
    }
    setServerUrl(url)
    queryClient.clear()
    void navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_60%)]" />
      <div className="relative w-full max-w-md animate-rise">
        <Logo className="mx-auto mb-8 w-fit scale-110" />
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="rounded-3xl border border-white/10 bg-ink-850/80 p-7 shadow-2xl backdrop-blur-2xl sm:p-9"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25">
            <Server className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-white">Connect to your server</h1>
          <p className="mt-1.5 text-sm text-ink-400">
            Enter the address of the OpenTV server you or a friend host with Docker.
          </p>
          <div className="mt-6">
            <Field
              label="Server address"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https://tv.example.com"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          </div>
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
            disabled={checking || !value.trim()}
          >
            {checking && <Spinner className="size-4 border-white/30 border-t-white" />}
            Connect
          </Button>
          {current && (
            <Button variant="ghost" className="mt-2 w-full" onClick={() => void navigate(-1)}>
              Cancel
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}
