'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  labels: { previous: string; next: string; page: string }
  className?: string
}

const ELLIPSIS = 'ellipsis'

/**
 * Windowed page list: first, last, and the current page with a neighbour on
 * each side. Returns page numbers plus `'ellipsis'` markers.
 */
export function paginationRange(
  page: number,
  pageCount: number
): (number | typeof ELLIPSIS)[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }
  const pages = new Set([1, pageCount, page, page - 1, page + 1])
  const visible = [...pages]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b)

  const out: (number | typeof ELLIPSIS)[] = []
  visible.forEach((value, index) => {
    if (index > 0 && value - visible[index - 1] > 1) out.push(ELLIPSIS)
    out.push(value)
  })
  return out
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  labels,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null
  const items = paginationRange(page, pageCount)

  const step =
    'text-caption border-border inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-control border px-3 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

  return (
    <nav className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        className={cn(step, 'hover:bg-muted')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        {/* The chevron points back along the reading direction. */}
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
        {labels.previous}
      </button>

      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <span
            key={`gap-${index}`}
            className="text-muted-foreground px-1"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`${labels.page} ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              step,
              'tabular-nums',
              item === page
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className={cn(step, 'hover:bg-muted')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
      >
        {labels.next}
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
      </button>
    </nav>
  )
}
