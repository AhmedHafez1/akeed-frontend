import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Label } from '@/shared/ui'

/** Border and halo for a field that needs attention, as in onboarding. */
export const AUTH_WARNING_FIELD =
  'border-ak-warning ring-ak-warning-soft focus:border-ak-warning ring-4'

interface AuthFieldProps {
  htmlFor: string
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  children: (props: { describedBy: string | undefined }) => ReactNode
}

/**
 * Label, control, then either the error or the hint. The error replaces the
 * hint so the field says one thing at a time: what to type.
 */
export function AuthField({
  htmlFor,
  label,
  hint,
  error,
  children,
}: AuthFieldProps) {
  const hintId = `${htmlFor}-hint`
  const errorId = `${htmlFor}-error`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-ink text-sm font-semibold">
        {label}
      </Label>
      {children({ describedBy })}
      {error ? (
        <p
          id={errorId}
          className="text-ak-warning flex items-start gap-1.5 text-sm font-medium"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-ink-muted text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
