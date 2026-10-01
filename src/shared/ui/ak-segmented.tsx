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
    ...props
  }: AkSegmentedProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      role="group"
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
 * sunken track: the preview language, a delay preset. Every option stays in
 * the tab order, as toggle buttons do.
 */
export const AkSegmented = React.forwardRef(AkSegmentedInner) as (<
  T extends string,
>(
  props: AkSegmentedProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement) & { displayName?: string }
AkSegmented.displayName = 'AkSegmented'
