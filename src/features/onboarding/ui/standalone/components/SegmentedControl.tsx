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
              '-ms-px inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-slate-200 px-4 text-sm transition-colors first:ms-0 first:rounded-s-lg last:rounded-e-lg focus:z-10 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              isSelected
                ? 'z-10 border-emerald-500 bg-emerald-50 font-medium text-emerald-800'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            {option.label}
            {isSelected && (
              <Check aria-hidden="true" className="h-4 w-4 text-emerald-600" />
            )}
          </button>
        )
      })}
    </div>
  )
}
