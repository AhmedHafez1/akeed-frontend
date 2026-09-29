import { getAuthErrorCode, isAlreadyRegistered } from '@/shared/lib/authErrors'

export interface SignupValues {
  fullName: string
  storeName: string
  email: string
  password: string
  terms: boolean
}

export type SignupField = keyof SignupValues

/** Form order; the first invalid field in this order gets focus. */
export const SIGNUP_FIELDS: readonly SignupField[] = [
  'fullName',
  'storeName',
  'email',
  'password',
  'terms',
]

export const SIGNUP_FIELD_IDS: Record<SignupField, string> = {
  fullName: 'signup-full-name',
  storeName: 'signup-store-name',
  email: 'signup-email',
  password: 'signup-password',
  terms: 'signup-terms',
}

export const SIGNUP_PASSWORD_MIN_LENGTH = 8
export const SIGNUP_STORE_NAME_MAX_LENGTH = 120

/** Message keys under `auth.signup.errors`. */
export type SignupFieldError =
  | 'fullNameRequired'
  | 'storeNameRequired'
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordTooShort'
  | 'passwordWeak'
  | 'termsRequired'
  | 'emailRegistered'

export type SignupFieldErrors = Partial<Record<SignupField, SignupFieldError>>

export const EMPTY_SIGNUP_VALUES: SignupValues = {
  fullName: '',
  storeName: '',
  email: '',
  password: '',
  terms: false,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function validateSignup(values: SignupValues): SignupFieldErrors {
  const errors: SignupFieldErrors = {}

  if (!values.fullName.trim()) errors.fullName = 'fullNameRequired'
  if (!values.storeName.trim()) errors.storeName = 'storeNameRequired'

  if (!values.email.trim()) errors.email = 'emailRequired'
  else if (!isValidEmail(values.email)) errors.email = 'emailInvalid'

  if (values.password.length < SIGNUP_PASSWORD_MIN_LENGTH) {
    errors.password = 'passwordTooShort'
  }

  if (!values.terms) errors.terms = 'termsRequired'

  return errors
}

export function firstInvalidField(
  errors: SignupFieldErrors
): SignupField | null {
  return SIGNUP_FIELDS.find((field) => errors[field]) ?? null
}

/** Message keys under `auth.signup.errors` for problems not tied to a field. */
export type SignupFormError = 'rateLimited' | 'failed'

export type SignupOutcome =
  | { kind: 'field'; field: SignupField; error: SignupFieldError }
  | { kind: 'form'; error: SignupFormError }

/** Maps a Supabase signUp failure onto the field it belongs to. */
export function mapSignUpError(error: unknown): SignupOutcome {
  if (isAlreadyRegistered(error)) {
    return { kind: 'field', field: 'email', error: 'emailRegistered' }
  }

  switch (getAuthErrorCode(error)) {
    case 'weak_password':
      return { kind: 'field', field: 'password', error: 'passwordWeak' }
    case 'email_address_invalid':
      return { kind: 'field', field: 'email', error: 'emailInvalid' }
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return { kind: 'form', error: 'rateLimited' }
    default:
      return { kind: 'form', error: 'failed' }
  }
}

export function toSignupMetadata(values: SignupValues) {
  return {
    full_name: values.fullName.trim(),
    // `company_name` is what org provisioning and the store-name prefill read.
    company_name: values.storeName.trim(),
  }
}

/** `?sent=1&email=…`: the verify-email screen survives a refresh. */
export function buildSentSearch(email: string): string {
  const params = new URLSearchParams({ sent: '1', email: email.trim() })
  return `?${params.toString()}`
}

export function readSentEmail(params: {
  get(name: string): string | null
}): string | null {
  if (params.get('sent') !== '1') return null
  const email = params.get('email')?.trim() ?? ''
  return isValidEmail(email) ? email : null
}
