import clsx from 'clsx'
import { ShieldCheck, Star, TriangleAlert } from 'lucide-react'
import type { Provider } from '@/lib/providers'

interface ServerSelectorProps {
  providers: Provider[]
  selected: string | undefined
  onSelect: (id: string) => void
  adShield: boolean
  onToggleAdShield: () => void
}

export function ServerSelector({
  providers,
  selected,
  onSelect,
  adShield,
  onToggleAdShield,
}: ServerSelectorProps) {
  return (
    <section
      aria-labelledby="server-heading"
      className="rounded-3xl border border-white/5 bg-ink-850/80 p-4 sm:p-6"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-ink-200">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
        <p>
          Streams come from third-party servers. For the best experience use an ad blocker such as{' '}
          <strong className="text-white">uBlock Origin</strong> or the{' '}
          <strong className="text-white">Brave</strong> browser, and switch servers if one does not
          load.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="server-heading" className="text-sm font-semibold text-ink-200">
          Select server{' '}
          <span className="font-normal text-ink-400">
            (<Star className="inline size-3 fill-amber-300 text-amber-300" aria-hidden="true" /> =
            recommended)
          </span>
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={adShield}
          onClick={onToggleAdShield}
          title="Blocks pop-ups and redirects from the player. Turn off if a server refuses to play."
          className={clsx(
            'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
            adShield
              ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
              : 'bg-white/5 text-ink-300 ring-white/10 hover:text-white',
          )}
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          Pop-up shield {adShield ? 'on' : 'off'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Streaming servers">
        {providers.map((provider) => {
          const active = provider.id === selected
          return (
            <button
              key={provider.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(provider.id)}
              className={clsx(
                'flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 transition active:scale-[0.97]',
                active
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30 ring-brand-400/50'
                  : 'bg-ink-800 text-ink-200 ring-white/5 hover:bg-ink-750 hover:text-white hover:ring-white/15',
              )}
            >
              {provider.name}
              {provider.language && (
                <span className={clsx('text-xs', active ? 'text-white/80' : 'text-ink-400')}>
                  ({provider.language})
                </span>
              )}
              {provider.recommended && (
                <Star className="size-3.5 fill-amber-300 text-amber-300" aria-label="Recommended" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
