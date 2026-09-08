'use client'

import type { ReactNode } from 'react'
import { Label } from '@/shared/ui'

interface OnboardingFieldProps {
  /** Rendered as `htmlFor`; also the base for the help/error ids. */
  htmlFor?: string
  label: string
  helpText?: string
  error?: string
  required?: boolean
  children: (ids: { describedBy: string | undefined }) => ReactNode
}

/**
 * Field wrapper that owns the help/error ids so every control can be wired to
 * its own message with `aria-describedby` and `aria-invalid`.
 */
export function OnboardingField({
  htmlFor,
  label,
  helpText,
  error,
  required = false,
  children,
}: OnboardingFieldProps) {
  const helpId = htmlFor ? `${htmlFor}-help` : undefined
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const describedBy =
    [error && errorId, helpText && helpId].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="space-y-2 text-start">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-1 text-red-600">
            *
          </span>
        )}
      </Label>
      {children({ describedBy })}
      {helpText && (
        <p id={helpId} className="text-xs leading-5 text-slate-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
