import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface PublicPageShellProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function PublicPageShell({
  eyebrow,
  title,
  description,
  meta,
  children,
  className,
  contentClassName,
}: PublicPageShellProps) {
  return (
    <section
      className={cn(
        'min-h-[calc(100svh-4rem)] border-t border-slate-200/70 bg-linear-to-b from-gray-100 via-gray-200 to-gray-50 px-4 pt-24 pb-16 sm:px-6 md:pt-28 md:pb-20 lg:px-8',
        className
      )}
    >
      <div className="mx-auto max-w-5xl">
        <header className="landing-section-header mb-10 sm:mb-12 lg:mb-14">
          {eyebrow && (
            <p className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="landing-section-title max-w-5xl">
            {title}
          </h1>
          {meta && (
            <div className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              {meta}
            </div>
          )}
          {description && (
            <p className="landing-subtitle max-w-3xl">
              {description}
            </p>
          )}
        </header>

        <div className={cn('', contentClassName)}>{children}</div>
      </div>
    </section>
  )
}

interface PublicInfoCardProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}

export function PublicInfoCard({
  icon,
  title,
  description,
  children,
  className,
}: PublicInfoCardProps) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md md:p-7',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-800">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </article>
  )
}
