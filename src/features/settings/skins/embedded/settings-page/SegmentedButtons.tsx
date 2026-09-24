'use client'

import { Button, ButtonGroup } from '@shopify/polaris'

export interface SegmentedOption<TValue extends string | number> {
  value: TValue
  label: string
}

interface SegmentedButtonsProps<TValue extends string | number> {
  /** Accessible name for the group; the visible label is up to the caller. */
  label: string
  options: ReadonlyArray<SegmentedOption<TValue>>
  value: TValue | null
  disabled?: boolean
  onChange: (value: TValue) => void
}

/**
 * Polaris segmented `ButtonGroup` with `pressed` state. Each button reports
 * its pressed state to assistive tech through `aria-pressed`, and the group
 * is named with `role="group"`.
 */
export function SegmentedButtons<TValue extends string | number>({
  label,
  options,
  value,
  disabled,
  onChange,
}: SegmentedButtonsProps<TValue>) {
  return (
    <div role="group" aria-label={label}>
      <ButtonGroup variant="segmented">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            pressed={option.value === value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
