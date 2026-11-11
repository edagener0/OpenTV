import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface SectionHeaderProps {
  title: ReactNode
  subtitle?: string
  to?: string
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, to, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {action}
      {to && (
        <Link
          to={to}
          className="group flex shrink-0 items-center gap-0.5 text-sm font-medium text-ink-300 transition hover:text-brand-300"
        >
          See all
          <ChevronRight
            className="size-4 transition group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  )
}
