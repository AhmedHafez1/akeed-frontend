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
  id?: string
  name?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  onBlur?: React.FocusEventHandler<HTMLInputElement>
}

/**
 * International phone number input with a country-code dropdown and flags.
 *
 * • Outputs a valid **E.164** formatted string.
 * • Excludes blocked territories from the country list.
 * • Provides real-time validation feedback (green/red border).
 * • Mobile-friendly with large touch targets.
 */
export const InternationalPhoneInput = React.forwardRef<
  HTMLInputElement,
  InternationalPhoneInputProps
>(function InternationalPhoneInput(
  {
    value,
    onChange,
    placeholder = '+20 123 456 7890',
    defaultCountry = 'EG',
    label,
    disabled = false,
    className,
    id,
    name,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    onBlur,
  },
  ref
) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isValid = value ? isValidPhoneNumber(value) : null
  const hasError = ariaInvalid === true || isValid === false

  React.useImperativeHandle(ref, () => {
    const input = containerRef.current?.querySelector('input')
    if (!input) {
      throw new Error('International phone input is not mounted')
    }
    return input
  })

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
        ref={containerRef}
        dir="ltr"
        className={cn(
          'intl-phone relative flex h-12 w-full items-center rounded-lg border-2 border-gray-200 bg-white px-3 transition-colors rtl:justify-end',
          'focus-within:border-ring focus-within:bg-slate-100',
          isValid === true &&
            'border-green-600 focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600',
          hasError &&
            'border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <PhoneInput
          id={inputId}
          name={name}
          required={required}
          aria-describedby={ariaDescribedBy}
          aria-invalid={hasError}
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          countries={ALLOWED_COUNTRIES}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={onBlur}
        />
      </div>
    </div>
  )
})

InternationalPhoneInput.displayName = 'InternationalPhoneInput'

/**
 * Thin validation helper re-exported for convenience so consumers don't need
 * a direct dependency on `react-phone-number-input`.
 */
export { isValidPhoneNumber } from 'react-phone-number-input'
export type {
  Value as E164Value,
  Country as PhoneCountry,
} from 'react-phone-number-input'
