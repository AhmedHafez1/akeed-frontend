'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { akButton } from '../shared/akStyles'

/**
 * "Showing 1–10 of 38 orders" with previous/next. The API pages by cursor,
 * so there are no page numbers to jump to — only the next page and the ones
 * already seen.
 */
export function ConfirmationsPager({
  label,
  summary,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
}: {
  /** Plain-text range, naming the navigation landmark. */
  label: string
  /** The visible range, with its numbers emphasised. */
  summary: ReactNode
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  previousLabel: string
  nextLabel: string
}) {
  const step = akButton({ variant: 'secondary', size: 'table' })

  return (
    <nav
      aria-label={label}
      className="border-line bg-surface-sunken flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-6"
    >
      <p
        role="status"
        aria-live="polite"
        className="text-ak-body text-ink-muted tabular-nums"
      >
        {summary}
      </p>
      <div className="flex items-center gap-2">
        {/* Chevrons point along the reading direction. */}
        <button
          type="button"
          className={step}
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft aria-hidden="true" className="rtl:-scale-x-100" />
          {previousLabel}
        </button>
        <button
          type="button"
          className={step}
          onClick={onNext}
          disabled={!hasNext}
        >
          {nextLabel}
          <ChevronRight aria-hidden="true" className="rtl:-scale-x-100" />
        </button>
      </div>
    </nav>
  )
}
