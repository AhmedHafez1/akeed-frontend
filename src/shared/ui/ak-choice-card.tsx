'use client'

import * as React from 'react'

import { cn } from '@/shared/lib/utils'

export interface AkChoiceGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role'
> {
  /** One stacked column, or a two-column grid from `sm` up. */
  columns?: 1 | 2
}

/**
 * A group of radio cards (`role="radiogroup"`). Name it with `aria-label` or
 * `aria-labelledby`, and keep exactly one `AkChoiceCard` checked: that card
 * is the group's single tab stop, and the arrow keys move the selection,
 * horizontal ones following the writing direction.
 */
export const AkChoiceGroup = React.forwardRef<
  HTMLDivElement,
  AkChoiceGroupProps
>(({ columns = 1, className, onKeyDown, ...props }, ref) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const forward = [rtl ? 'ArrowLeft' : 'ArrowRight', 'ArrowDown']
    const backward = [rtl ? 'ArrowRight' : 'ArrowLeft', 'ArrowUp']
    const delta = forward.includes(event.key)
      ? 1
      : backward.includes(event.key)
        ? -1
        : 0
    if (!delta) return
    const cards = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not(:disabled)'
      )
    )
    const index = cards.indexOf(document.activeElement as HTMLButtonElement)
    if (index < 0) return
    event.preventDefault()
    const next = cards[(index + delta + cards.length) % cards.length]
    next.focus()
    next.click()
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      onKeyDown={handleKeyDown}
      className={cn('grid gap-2', columns === 2 && 'sm:grid-cols-2', className)}
      {...props}
    />
  )
})
AkChoiceGroup.displayName = 'AkChoiceGroup'

export interface AkChoiceCardProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'title' | 'role' | 'type' | 'onSelect'
> {
  checked: boolean
  onSelect: () => void
  title: React.ReactNode
  /** A pill beside the title, e.g. `akPill`. */
  badge?: React.ReactNode
  description?: React.ReactNode
  /** For a description in another script than the page (a template line). */
  descriptionDir?: 'rtl' | 'ltr'
  descriptionLang?: string
}

/**
 * One radio card: a dot, a title and an optional line under it. Checked is a
 * brand border with an inset ring on the soft brand ground, so the selection
 * does not rest on colour alone (the dot fills too).
 */
export const AkChoiceCard = React.forwardRef<
  HTMLButtonElement,
  AkChoiceCardProps
>(
  (
    {
      checked,
      onSelect,
      title,
      badge,
      description,
      descriptionDir,
      descriptionLang,
      className,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={checked ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'ak-focus rounded-ak-card text-ink flex w-full cursor-pointer items-start gap-3 border px-4 py-3.5 text-start disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors motion-safe:duration-150',
        checked
          ? 'border-brand bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]'
          : 'border-line-strong bg-surface-raised hover:border-control-border',
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'bg-surface-raised mt-0.75 grid size-4.5 shrink-0 place-items-center rounded-full border-[1.5px]',
          checked ? 'border-brand' : 'border-control-border'
        )}
      >
        {checked && <span className="bg-brand size-2 rounded-full" />}
      </span>
      <span className="min-w-0">
        <span className="text-ak-body flex flex-wrap items-center gap-2 font-semibold">
          {title}
          {badge}
        </span>
        {description && (
          <span
            dir={descriptionDir}
            lang={descriptionLang}
            className={cn(
              'text-ak-caption mt-0.5 block',
              checked ? 'text-brand-ink/85' : 'text-ink-muted'
            )}
          >
            {description}
          </span>
        )}
      </span>
    </button>
  )
)
AkChoiceCard.displayName = 'AkChoiceCard'
