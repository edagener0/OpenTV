import { AlertTriangle } from 'lucide-react'
import { ApiError, errorMessage } from '@/lib/api'
import { Button } from './Button'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const notConfigured = error instanceof ApiError && error.status === 503
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-14 text-center">
      <AlertTriangle className="mb-4 size-8 text-red-300" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-white">
        {notConfigured ? 'Server is not fully configured' : 'Could not load this content'}
      </h3>
      <p className="mt-2 max-w-md text-sm text-ink-300">
        {notConfigured
          ? 'The server administrator needs to set TMDB_API_KEY before content can be browsed.'
          : errorMessage(error)}
      </p>
      {onRetry && !notConfigured && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
