'use client'

import { cn } from '@/shared/lib/utils'

interface OnboardingSwitchProps {
  checked: boolean
  disabled?: boolean
  label: string
  describedBy?: string
  onChange: (checked: boolean) => void
}

/**
 * Mirrors the standalone Settings switch so both surfaces read identically.
 * Knob offset uses logical `start-*` so it flips correctly in Arabic.
 */
export function OnboardingSwitch({
  checked,
  disabled = false,
  label,
  describedBy,
  onChange,
}: OnboardingSwitchProps) {
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
        'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-emerald-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[inset-inline-start]',
          checked ? 'start-[22px]' : 'start-0.5'
        )}
      />
    </button>
  )
}
