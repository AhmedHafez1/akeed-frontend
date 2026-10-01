'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export interface AkSelectOption {
  value: string
  label: string
}

export interface AkSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  options: ReadonlyArray<AkSelectOption>
}

/**
 * The native `<select>` of the Akeed app pages, 40px high. Native so the
 * phone's own picker opens; the chevron sits at the logical end. Label it
 * with a `<label htmlFor>`; `aria-invalid` turns the border to the warning
 * colour. `className` sizes the wrapper.
 */
export const AkSelect = React.forwardRef<HTMLSelectElement, AkSelectProps>(
  ({ options, className, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        className={cn(
          'ak-focus bg-surface-raised text-ink text-ak-body rounded-ak-control h-10 w-full cursor-pointer appearance-none border ps-3 pe-9 disabled:cursor-not-allowed disabled:opacity-60',
          props['aria-invalid'] ? 'border-ak-warning' : 'border-control-border'
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-ink-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
      />
    </div>
  )
)
AkSelect.displayName = 'AkSelect'
