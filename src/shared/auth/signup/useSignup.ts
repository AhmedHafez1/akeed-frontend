'use client'

import { useCallback, useState } from 'react'
import { auth, getEmailRedirectUrl } from '@/shared/lib/auth'
import { isAlreadyRegistered } from '@/shared/lib/authErrors'
import {
  EMPTY_SIGNUP_VALUES,
  firstInvalidField,
  mapSignUpError,
  toSignupMetadata,
  validateSignup,
  type SignupField,
  type SignupFieldErrors,
  type SignupFormError,
  type SignupValues,
} from './signup.model'

interface UseSignupOptions {
  locale: string
  /** No session yet: the merchant has to confirm their email first. */
  onEmailSent: (email: string) => void
  /** Email confirmation is off, so signUp already signed them in. */
  onSignedIn: () => void
}

export interface SignupController {
  values: SignupValues
  fieldErrors: SignupFieldErrors
  formError: SignupFormError | null
  isSubmitting: boolean
  setValue: <TField extends SignupField>(
    field: TField,
    value: SignupValues[TField]
  ) => void
  /** Resolves to the field that should take focus, if any. */
  submit: () => Promise<SignupField | null>
}

/**
 * Owns the signup values for the whole flow, so "Change email" on the verify
 * screen returns to a form that still has them. The password lives only here,
 * in memory; it is never written to the URL or to storage.
 */
export function useSignup({
  locale,
  onEmailSent,
  onSignedIn,
}: UseSignupOptions): SignupController {
  const [values, setValues] = useState<SignupValues>(EMPTY_SIGNUP_VALUES)
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})
  const [formError, setFormError] = useState<SignupFormError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback(
    <TField extends SignupField>(
      field: TField,
      value: SignupValues[TField]
    ) => {
      setValues((previous) => ({ ...previous, [field]: value }))
      setFieldErrors((previous) =>
        previous[field] ? { ...previous, [field]: undefined } : previous
      )
    },
    []
  )

  const submit = useCallback(async (): Promise<SignupField | null> => {
    setFormError(null)
    const errors = validateSignup(values)
    const invalid = firstInvalidField(errors)
    setFieldErrors(errors)
    if (invalid) return invalid

    const email = values.email.trim()
    setIsSubmitting(true)
    try {
      const data = await auth.signUp(email, values.password, {
        metadata: toSignupMetadata(values),
        emailRedirectTo: getEmailRedirectUrl(locale, window.location.origin),
      })

      if (isAlreadyRegistered(null, data)) {
        setFieldErrors({ email: 'emailRegistered' })
        return 'email'
      }

      if (data.session) onSignedIn()
      else onEmailSent(email)
      return null
    } catch (error) {
      const outcome = mapSignUpError(error)
      if (outcome.kind === 'field') {
        setFieldErrors({ [outcome.field]: outcome.error })
        return outcome.field
      }
      setFormError(outcome.error)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [locale, onEmailSent, onSignedIn, values])

  return { values, fieldErrors, formError, isSubmitting, setValue, submit }
}
