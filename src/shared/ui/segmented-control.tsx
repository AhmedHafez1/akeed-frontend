'use client'

import * as React from 'react'

import { cn } from '@/shared/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Optional trailing count, e.g. the number of rows a filter would keep. */
  count?: number
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  className?: string
}

/*
 * A filter switch, not a tab strip — the panel below is one list that gets
 * narrowed, so `radiogroup` describes it honestly and Radix Tabs (which is not
 * a dependency of this app) would be the wrong semantics as well as a new
 * package.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const ref = React.useRef<HTMLDivElement>(null)

  const move = (delta: number) => {
    const index = options.findIndex((option) => option.value === value)
    if (index < 0) return
    const next = options[(index + delta + options.length) % options.length]
    onChange(next.value)
    // Roving focus: the newly selected button is the only tabbable one.
    ref.current
      ?.querySelectorAll<HTMLButtonElement>('button')
      [options.indexOf(next)]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Horizontal arrows follow the writing direction so RTL reads naturally.
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward || event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === backward || event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    }
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        'border-border bg-muted/50 rounded-control inline-flex items-center gap-1 border p-1',
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'text-caption focus-visible:ring-ring rounded-[calc(var(--radius-control)-0.25rem)] px-3 py-1.5 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
              selected
                ? 'bg-primary text-primary-foreground shadow-raised'
                : 'text-muted-foreground hover:text-foreground hover:bg-background'
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ms-1.5 tabular-nums opacity-70" dir="ltr">
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
