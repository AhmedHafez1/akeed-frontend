'use client'

import * as React from 'react'
import PhoneInput, {
  type Country,
  type Value,
  isValidPhoneNumber,
  getCountries,
} from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { cn } from '@/shared/lib/utils'

/**
 * Countries excluded from the phone-input country picker.
 *
 * IL — occupied Palestinian territories (commonly mislabelled).
 */
const EXCLUDED_COUNTRIES: ReadonlySet<Country> = new Set<Country>(['IL'])

/** All countries the picker should show (everything minus the exclusion list). */
const ALLOWED_COUNTRIES: Country[] = getCountries().filter(
  (c) => !EXCLUDED_COUNTRIES.has(c)
)

export interface InternationalPhoneInputProps {
  /** Current value in E.164 format (e.g. "+201234567890"). */
  value: Value | undefined
  /** Called with an E.164 string or `undefined` when the field is cleared. */
  onChange: (value: Value | undefined) => void
  /** Placeholder shown inside the number field. */
  placeholder?: string
  /** Default country pre-selected in the dropdown. */
  defaultCountry?: Country
  /** Accessible label for the phone input. */
  label?: string
  /** Disables the entire input. */
  disabled?: boolean
  /** Extra class names applied to the wrapper. */
  className?: string
}

/**
 * International phone number input with a country-code dropdown and flags.
 *
 * • Outputs a valid **E.164** formatted string.
 * • Excludes blocked territories from the country list.
 * • Provides real-time validation feedback (green/red border).
 * • Mobile-friendly with large touch targets.
 */
export function InternationalPhoneInput({
  value,
  onChange,
  placeholder = '+20 123 456 7890',
  defaultCountry = 'EG',
  label,
  disabled = false,
  className,
}: InternationalPhoneInputProps) {
  const inputId = React.useId()
  const isValid = value ? isValidPhoneNumber(value) : null

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'intl-phone relative flex h-10 w-full items-center rounded-lg border-2 border-gray-200 bg-white px-3 transition-colors',
          'focus-within:border-ring focus-within:bg-slate-100',
          isValid === true &&
            'border-green-600 focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600',
          isValid === false &&
            'border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <PhoneInput
          id={inputId}
          aria-invalid={isValid === false}
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          countries={ALLOWED_COUNTRIES}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

/**
 * Thin validation helper re-exported for convenience so consumers don't need
 * a direct dependency on `react-phone-number-input`.
 */
export { isValidPhoneNumber } from 'react-phone-number-input'
export type {
  Value as E164Value,
  Country as PhoneCountry,
} from 'react-phone-number-input'
