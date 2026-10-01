'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface QuantityStepperProps {
  id: string
  value: string
  onChange: (value: string) => void
  onStep: (direction: -1 | 1) => void
  disabled: boolean
  invalid: boolean
  describedBy: string
  decreaseLabel: string
  increaseLabel: string
}

const stepButton =
  'ak-focus text-ink hover:bg-surface-sunken relative grid w-11 shrink-0 cursor-pointer place-items-center transition-colors focus-visible:z-10 disabled:cursor-not-allowed'

/**
 * Minus, the amount, plus, as one bordered control with 44px targets. The
 * field stays free text so any amount can be typed; the buttons snap it onto
 * the step grid.
 */
export function QuantityStepper({
  id,
  value,
  onChange,
  onStep,
  disabled,
  invalid,
  describedBy,
  decreaseLabel,
  increaseLabel,
}: QuantityStepperProps) {
  return (
    <div
      className={cn(
        'bg-surface-raised rounded-ak-control inline-flex items-stretch border',
        invalid ? 'border-ak-warning' : 'border-control-border',
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={disabled}
        aria-label={decreaseLabel}
        className={cn(stepButton, 'rounded-s-ak-control')}
      >
        <Minus aria-hidden="true" className="size-4.5" />
      </button>
      <input
        id={id}
        dir="ltr"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className="ak-focus border-line text-ink relative h-11 w-30 border-x bg-transparent text-center text-[1.0625rem] font-semibold tabular-nums focus-visible:z-10 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={disabled}
        aria-label={increaseLabel}
        className={cn(stepButton, 'rounded-e-ak-control')}
      >
        <Plus aria-hidden="true" className="size-4.5" />
      </button>
    </div>
  )
}
