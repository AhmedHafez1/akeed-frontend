'use client'

import * as React from 'react'
import { Input, InputProps } from './input'
import { cn } from '@/shared/lib/utils'
import { isValidEgyptianPhone } from '@/shared/lib/utils'

export interface PhoneInputProps extends Omit<InputProps, 'type'> {
  onValidityChange?: (isValid: boolean) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onValidityChange, onChange, ...props }, ref) => {
    const [isValid, setIsValid] = React.useState<boolean | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      
      // Only allow digits
      const cleaned = value.replace(/\D/g, '')
      e.target.value = cleaned

      // Validate
      if (cleaned.length >= 10) {
        const valid = isValidEgyptianPhone(cleaned)
        setIsValid(valid)
        onValidityChange?.(valid)
      } else {
        setIsValid(null)
        onValidityChange?.(false)
      }

      onChange?.(e)
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          maxLength={11}
          placeholder="01012345678"
          dir="ltr"
          className={cn(
            'transition-colors',
            isValid === true && 'border-green-500 focus-visible:ring-green-500',
            isValid === false && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          onChange={handleChange}
          {...props}
        />
        {isValid === true && (
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-green-500">
            ✓
          </span>
        )}
        {isValid === false && (
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-red-500">
            ✗
          </span>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }