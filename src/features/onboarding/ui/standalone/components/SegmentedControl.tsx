'use client'

import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface SegmentedControlOption<TValue extends string> {
  label: string
  value: TValue
}

interface SegmentedControlProps<TValue extends string> {
  label: string
  value: TValue
  options: ReadonlyArray<SegmentedControlOption<TValue>>
  disabled?: boolean
  describedBy?: string
  onChange: (value: TValue) => void
}

/**
 * Accessible segmented control matching the standalone Settings delay picker:
 * one group, `aria-pressed` per segment, joined with logical borders so the
 * rounded ends land on the correct side in both directions.
 */
export function SegmentedControl<TValue extends string>({
  label,
  value,
  options,
  disabled = false,
  describedBy,
  onChange,
}: SegmentedControlProps<TValue>) {
  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className="flex flex-wrap"
    >
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'border-border focus-visible:ring-ring -ms-px inline-flex min-h-11 flex-1 items-center justify-center gap-2 border px-4 text-sm transition-colors first:ms-0 first:rounded-s-lg last:rounded-e-lg focus:z-10 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              isSelected
                ? 'border-primary bg-primary-subtle text-primary z-10 font-bold'
                : 'bg-card text-foreground/80 hover:bg-muted/50'
            )}
          >
            {option.label}
            {isSelected && (
              <Check aria-hidden="true" className="text-primary h-5 w-5" />
            )}
          </button>
        )
      })}
    </div>
  )
}
