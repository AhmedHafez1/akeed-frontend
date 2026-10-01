'use client'

import * as React from 'react'

import { cn } from '@/shared/lib/utils'

export interface AkSwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role' | 'type'
> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/**
 * The on/off toggle of the Akeed app pages (`role="switch"`), 40×24. Name it
 * with `aria-label` or `aria-labelledby`. The knob moves with logical
 * `start-*`, so it travels the right way in Arabic.
 */
export const AkSwitch = React.forwardRef<HTMLButtonElement, AkSwitchProps>(
  ({ checked, onCheckedChange, className, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) onCheckedChange(!checked)
      }}
      className={cn(
        'ak-focus relative h-6 w-10 shrink-0 cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-45 motion-safe:transition-colors motion-safe:duration-150',
        checked ? 'bg-brand' : 'bg-control-border',
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0.75 size-4.5 rounded-full shadow-sm motion-safe:transition-[inset-inline-start] motion-safe:duration-200',
          checked ? 'bg-brand-foreground start-4.75' : 'bg-ak-knob start-0.75'
        )}
      />
    </button>
  )
)
AkSwitch.displayName = 'AkSwitch'
