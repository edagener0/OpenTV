import clsx from 'clsx'
import { forwardRef, type InputHTMLAttributes, useId } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-200">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'h-12 w-full rounded-xl border border-white/10 bg-ink-850 px-4 text-[15px] text-white placeholder:text-ink-400 transition focus:border-brand-500/60 focus:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
          className,
        )}
        {...props}
      />
      {hint && <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>}
    </label>
  )
})
