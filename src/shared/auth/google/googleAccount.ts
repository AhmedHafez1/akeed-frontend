import type { User } from '@supabase/supabase-js'
import {
  api,
  clearStandaloneOrganizationBootstrap,
  ensureStandaloneOrganization,
  getSupabaseClient,
} from '@/shared/lib/auth'
import { ApiError } from '@/shared/lib/http'
import { parseSignupSourceParam } from '@/shared/config/commerceSources'
import { saveGoogleAttempt, type GoogleAttempt } from '@/shared/lib/googleOAuth'
import { reportCompleteRegistration } from '@/shared/auth/signup/reportCompleteRegistration'
import type { SignupFieldErrors } from '@/shared/auth/signup/signup.model'

export interface GoogleAccountValues {
  fullName: string
  storeName: string
  terms: boolean
}

export function validateGoogleAccount(
  values: GoogleAccountValues
): SignupFieldErrors {
  const errors: SignupFieldErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'fullNameRequired'
  if (!values.storeName.trim()) errors.storeName = 'storeNameRequired'
  if (!values.terms) errors.terms = 'termsRequired'
  return errors
}

export async function hasGoogleOrganization(): Promise<boolean> {
  try {
    await api.get('/api/auth/me')
    return true
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 403 &&
      error.code === 'ORGANIZATION_REQUIRED'
    )
      return false
    throw error
  }
}

/** A successful retried provisioning request must not count an existing login as signup. */
export function reportGoogleRegistration(
  user: User,
  attempt: GoogleAttempt
): void {
  const createdAt = Date.parse(user.created_at)
  if (
    attempt.phase !== 'provisioning' ||
    !Number.isFinite(createdAt) ||
    createdAt < attempt.startedAt - 60_000
  )
    return
  reportCompleteRegistration(user.id, `google-registration-${user.id}`)
}

export async function completeGoogleAccount(
  user: User,
  attempt: GoogleAttempt,
  values: GoogleAccountValues
): Promise<boolean> {
  if (Object.keys(validateGoogleAccount(values)).length)
    throw new Error('GOOGLE_ACCOUNT_INVALID')
  const source = parseSignupSourceParam(attempt.source)
  if (!source) throw new Error('GOOGLE_SOURCE_REQUIRED')
  const supabase = getSupabaseClient()
  const { data: identity, error: identityError } = await supabase.auth.getUser()
  if (
    identityError ||
    identity.user?.id !== user.id ||
    attempt.userId !== user.id
  )
    throw new Error('GOOGLE_SESSION_CHANGED')
  // Recheck before profile writes: another tab may have completed this account.
  if (await hasGoogleOrganization()) {
    reportGoogleRegistration(user, attempt)
    return true
  }
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: values.fullName.trim(),
      company_name: values.storeName.trim().slice(0, 120),
      signup_source: source,
    },
  })
  if (error || !data.user || data.user.id !== user.id)
    throw new Error('GOOGLE_PROFILE_UPDATE_FAILED')
  attempt.phase = 'provisioning'
  saveGoogleAttempt(attempt)
  clearStandaloneOrganizationBootstrap()
  const result = await ensureStandaloneOrganization(data.user)
  reportGoogleRegistration(user, attempt)
  return !result.created
}
