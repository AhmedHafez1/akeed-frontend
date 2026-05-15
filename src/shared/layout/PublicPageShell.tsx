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
        'min-h-[calc(100svh-4rem)] bg-linear-to-b from-slate-50 via-white to-slate-50 px-4 pt-24 pb-16 sm:px-6 md:pt-28 md:pb-20 lg:px-8',
        className
      )}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {eyebrow && (
            <p className="mb-3 text-sm font-semibold text-emerald-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl leading-tight font-bold text-slate-950 sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {meta && (
            <div className="mt-4 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              {meta}
            </div>
          )}
          {description && (
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>
          )}
        </header>

        <div className={cn('mt-10 md:mt-12', contentClassName)}>{children}</div>
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
        'rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/60 transition-shadow hover:shadow-md md:p-7',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl leading-8 font-bold text-slate-900">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </article>
  )
}
