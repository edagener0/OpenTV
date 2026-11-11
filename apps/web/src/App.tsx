import { lazy, type ReactNode, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageSpinner } from '@/components/ui/Spinner'
import { getServerUrl, isTauri } from '@/lib/platform'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const BrowsePage = lazy(() => import('@/pages/BrowsePage').then((m) => ({ default: m.BrowsePage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const DetailsPage = lazy(() =>
  import('@/pages/DetailsPage').then((m) => ({ default: m.DetailsPage })),
)
const WatchPage = lazy(() => import('@/pages/WatchPage').then((m) => ({ default: m.WatchPage })))
const LibraryPage = lazy(() =>
  import('@/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })),
)
const AccountPage = lazy(() =>
  import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })),
)
const AuthPage = lazy(() => import('@/pages/AuthPage').then((m) => ({ default: m.AuthPage })))
const SetupPage = lazy(() => import('@/pages/SetupPage').then((m) => ({ default: m.SetupPage })))

function RequireServer({ children }: { children: ReactNode }) {
  const location = useLocation()
  if (isTauri && !getServerUrl())
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function page(element: ReactNode) {
  return <Suspense fallback={<PageSpinner />}>{element}</Suspense>
}

const router = createBrowserRouter([
  {
    element: (
      <RequireServer>
        <AppLayout />
      </RequireServer>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movies', element: page(<BrowsePage key="movie" mediaType="movie" />) },
      { path: 'tv', element: page(<BrowsePage key="tv" mediaType="tv" />) },
      { path: 'search', element: page(<SearchPage />) },
      { path: 'movie/:id', element: page(<DetailsPage key="movie" mediaType="movie" />) },
      { path: 'tv/:id', element: page(<DetailsPage key="tv" mediaType="tv" />) },
      { path: 'watch/movie/:id', element: page(<WatchPage key="movie" mediaType="movie" />) },
      { path: 'watch/tv/:id', element: <Navigate to="1/1" relative="path" replace /> },
      {
        path: 'watch/tv/:id/:season/:episode',
        element: page(<WatchPage key="tv" mediaType="tv" />),
      },
      { path: 'library', element: page(<LibraryPage />) },
      { path: 'account', element: page(<AccountPage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'login',
    element: <RequireServer>{page(<AuthPage key="login" mode="login" />)}</RequireServer>,
  },
  {
    path: 'register',
    element: <RequireServer>{page(<AuthPage key="register" mode="register" />)}</RequireServer>,
  },
  { path: 'setup', element: isTauri ? page(<SetupPage />) : <Navigate to="/" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
