'use client'

import { Input } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'

interface NumericHoursInputProps {
  id: string
  value: string
  max: number
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  onChange: (value: string) => void
}

/**
 * Hour input. `dir="ltr"` keeps digit ordering correct, and the explicit
 * alignment class keeps the value on the locale's reading edge — inherited
 * direction alone would push it to the wrong side in Arabic.
 */
export function NumericHoursInput({
  id,
  value,
  max,
  disabled = false,
  invalid = false,
  describedBy,
  onChange,
}: NumericHoursInputProps) {
  const { isRTL } = useLocaleInfo()

  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      dir="ltr"
      min={0}
      max={max}
      step={0.25}
      disabled={disabled}
      value={value}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'max-w-40 tabular-nums',
        isRTL ? 'text-right' : 'text-left',
        invalid && 'border-red-400 focus:border-red-500'
      )}
    />
  )
}
