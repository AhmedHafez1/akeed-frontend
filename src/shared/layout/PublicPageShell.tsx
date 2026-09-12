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
        'border-border bg-canvas min-h-[calc(100svh-4rem)] border-t px-4 pt-24 pb-16 sm:px-6 md:pt-28 md:pb-20 lg:px-8',
        className
      )}
    >
      <div className="mx-auto max-w-5xl">
        <header className="landing-section-header mb-10 sm:mb-12 lg:mb-14">
          {eyebrow && (
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="text-h1 text-foreground max-w-5xl text-balance">
            {title}
          </h1>
          {meta && (
            <div className="border-primary-border bg-primary-subtle text-primary-subtle-foreground inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold">
              {meta}
            </div>
          )}
          {description && (
            <p className="text-lead text-muted-foreground max-w-3xl text-pretty">
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
        'group rounded-card border-border bg-card shadow-card hover:border-primary-border hover:shadow-overlay relative overflow-hidden border p-6 transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 md:p-7',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="bg-primary-subtle text-primary ring-primary-border flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-h3">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </article>
  )
}
