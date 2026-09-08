'use client'

import { ChevronDown } from 'lucide-react'

interface NativeSelectProps<TValue extends string> {
  id?: string
  value: TValue
  options: ReadonlyArray<{ label: string; value: TValue }>
  disabled?: boolean
  describedBy?: string
  onChange: (value: TValue) => void
}

/** Native select with a logically positioned chevron (`end-4`). */
export function NativeSelect<TValue extends string>({
  id,
  value,
  options,
  disabled = false,
  describedBy,
  onChange,
}: NativeSelectProps<TValue>) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="h-12 w-full appearance-none rounded-lg border-2 border-gray-200 bg-white py-2 ps-4 pe-11 text-start text-base transition-colors outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
      />
    </div>
  )
}
