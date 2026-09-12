'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { AcquisitionTarget } from '@/features/marketing/domain/acquisitionPaths'
import { cn } from '@/shared/lib/utils'

export type AcquisitionCtaVariant =
  | 'primary'
  | 'secondary'
  | 'compact'
  | 'compactSecondary'
  | 'ghost'

const baseClass =
  'group focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center justify-center transition-[background-color,box-shadow,transform,color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

const variantClasses: Record<AcquisitionCtaVariant, string> = {
  primary:
    'rounded-control bg-primary text-primary-foreground shadow-brand hover:bg-primary-hover h-19 gap-4 px-7 text-xl font-medium hover:-translate-y-0.5',
  secondary:
    'rounded-control bg-card/90 text-foreground shadow-card ring-border hover:bg-primary-subtle/70 hover:text-primary-subtle-foreground hover:ring-primary-border h-19 gap-3 px-7 text-lg font-medium ring-1 hover:-translate-y-0.5',
  compact:
    'rounded-control bg-primary text-primary-foreground shadow-brand hover:bg-primary-hover gap-2 px-5 py-2.5 text-sm font-bold hover:-translate-y-0.5',
  compactSecondary:
    'rounded-control bg-card text-foreground shadow-card ring-border hover:bg-primary-subtle/70 hover:text-primary-subtle-foreground hover:ring-primary-border gap-2 px-5 py-2.5 text-sm font-bold ring-1',
  ghost:
    'rounded-control text-slate-100 ring-1 ring-white/10 bg-white/8 hover:bg-white/12 hover:text-white hover:ring-primary-border gap-2 px-5 py-2.5 text-sm font-bold',
}

interface AcquisitionCtaProps {
  target: AcquisitionTarget
  label: string
  /** Rendered under the control — use for the standalone approval caveat. */
  note?: string
  variant?: AcquisitionCtaVariant
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
  ariaLabel?: string
  onNavigate?: () => void
}

/**
 * The single entry point into either acquisition path.
 *
 * Always renders a real link — never `window.location.assign` — so the control
 * keeps middle-click, "open in new tab", and assistive-technology semantics.
 */
export function AcquisitionCta({
  target,
  label,
  note,
  variant = 'primary',
  leading,
  trailing,
  className,
  ariaLabel,
  onNavigate,
}: AcquisitionCtaProps) {
  // With a note, the wrapper becomes the flex child, so it takes the caller's
  // sizing and the control simply fills it.
  const classes = cn(
    baseClass,
    variantClasses[variant],
    note ? 'w-full' : className
  )

  const content = (
    <>
      {leading}
      <span>{label}</span>
      {trailing}
    </>
  )

  const control =
    target.kind === 'internal' ? (
      <Link
        href={target.href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onNavigate}
      >
        {content}
      </Link>
    ) : (
      <a
        href={target.href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onNavigate}
        suppressHydrationWarning
      >
        {content}
      </a>
    )

  if (!note) {
    return control
  }

  return (
    <span className={cn('flex flex-col items-stretch gap-1.5', className)}>
      {control}
      <span className="text-muted-foreground text-center text-xs leading-4">
        {note}
      </span>
    </span>
  )
}
