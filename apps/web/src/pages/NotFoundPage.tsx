import { Home } from 'lucide-react'
import { PageContainer } from '@/components/layout/AppLayout'
import { ButtonLink } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Not found')
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-gradient font-display text-8xl font-black sm:text-9xl">404</p>
        <h1 className="mt-4 text-2xl font-bold text-white">This page went off the air</h1>
        <p className="mt-2 max-w-md text-ink-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        <ButtonLink to="/" className="mt-8">
          <Home className="size-4" aria-hidden="true" />
          Back home
        </ButtonLink>
      </div>
    </PageContainer>
  )
}
