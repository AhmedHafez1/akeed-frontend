'use client'

import * as React from 'react'

import { cn } from '@/shared/lib/utils'

export interface AkSegmentedOption<T extends string> {
  value: T
  label: string
}

export interface AkSegmentedProps<T extends string> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'role'
> {
  options: ReadonlyArray<AkSegmentedOption<T>>
  value: T
  onValueChange: (value: T) => void
  /** `sm` is the 28px switch in a card header; `md` the 34px form control. */
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label': string
}

function AkSegmentedInner<T extends string>(
  {
    options,
    value,
    onValueChange,
    size = 'md',
    disabled = false,
    className,
    onKeyDown,
    ...props
  }: AkSegmentedProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // With nothing pressed, the first option keeps the group reachable.
  const tabStop = options.some((option) => option.value === value)
    ? value
    : options[0]?.value

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)'
      )
    )
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (index < 0) return
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const targets: Record<string, number> = {
      [rtl ? 'ArrowLeft' : 'ArrowRight']: (index + 1) % buttons.length,
      [rtl ? 'ArrowRight' : 'ArrowLeft']:
        (index - 1 + buttons.length) % buttons.length,
      Home: 0,
      End: buttons.length - 1,
    }
    const next = targets[event.key]
    if (next === undefined) return
    event.preventDefault()
    buttons[next].focus()
  }

  return (
    <div
      ref={ref}
      role="group"
      onKeyDown={handleKeyDown}
      className={cn(
        'bg-neutral-soft rounded-ak-control inline-flex flex-wrap gap-0.5 p-0.75',
        className
      )}
      {...props}
    >
      {options.map((option) => {
        const pressed = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            tabIndex={option.value === tabStop ? 0 : -1}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'ak-focus cursor-pointer rounded-lg font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45 motion-safe:transition-colors motion-safe:duration-150',
              size === 'sm'
                ? 'text-ak-label h-7 px-2.5'
                : 'text-ak-caption h-8.5 px-3.5',
              pressed
                ? 'bg-surface-raised text-ink shadow-ak-segment'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A short set of exclusive choices as toggle buttons (`aria-pressed`) in a
 * sunken track: the preview language, a delay preset.
 * One tab stop for the group (the pressed option); the arrow keys, following
 * the writing direction, and Home / End move focus between options, and Space
 * or Enter picks the focused one.
 */
export const AkSegmented = React.forwardRef(AkSegmentedInner) as (<
  T extends string,
>(
  props: AkSegmentedProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement) & { displayName?: string }
AkSegmented.displayName = 'AkSegmented'
