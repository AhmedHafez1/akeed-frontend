'use client'

import { cn } from '@/shared/lib/utils'

export interface SwitchProps {
  checked: boolean
  disabled?: boolean
  label: string
  describedBy?: string
  onChange: (checked: boolean) => void
  className?: string
}

/**
 * An on/off toggle (`role="switch"`). Knob offset uses logical `start-*` so
 * it flips correctly in Arabic.
 */
export function Switch({
  checked,
  disabled = false,
  label,
  describedBy,
  onChange,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-visible:ring-ring relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
        className
      )}
    >
      <span
        className={cn(
          'bg-card absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-[inset-inline-start]',
          checked ? 'start-[22px]' : 'start-0.5'
        )}
      />
    </button>
  )
}
