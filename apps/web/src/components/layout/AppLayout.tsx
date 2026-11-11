import { Outlet, ScrollRestoration } from 'react-router'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'
import { Navbar } from './Navbar'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      <a
        href="#main"
        className="sr-only z-[200] rounded-lg bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <ScrollRestoration />
    </div>
  )
}

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1800px] px-4 pt-24 sm:px-6 lg:px-10 lg:pt-28 ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
