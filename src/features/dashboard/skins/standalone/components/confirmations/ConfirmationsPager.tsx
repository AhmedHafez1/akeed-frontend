'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui'

/**
 * "1–20 of 28" with previous/next. The API pages by cursor, so there are no
 * page numbers to jump to — only the next page and the ones already seen.
 */
export function ConfirmationsPager({
  label,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
}: {
  label: string
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  previousLabel: string
  nextLabel: string
}) {
  const step = cn(
    buttonVariants({ variant: 'outline', size: 'icon' }),
    'size-9 shadow-none'
  )

  return (
    <nav
      aria-label={label}
      className="border-border flex items-center justify-between gap-3 border-t px-4 py-3"
    >
      <p
        role="status"
        aria-live="polite"
        className="text-muted-foreground text-xs tabular-nums"
      >
        <bdi dir="ltr">{label}</bdi>
      </p>
      <div className="flex items-center gap-2">
        {/* Chevrons point along the reading direction. */}
        <button
          type="button"
          className={step}
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label={previousLabel}
        >
          <ChevronLeft aria-hidden="true" className="rtl:rotate-180" />
        </button>
        <button
          type="button"
          className={step}
          onClick={onNext}
          disabled={!hasNext}
          aria-label={nextLabel}
        >
          <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
        </button>
      </div>
    </nav>
  )
}
