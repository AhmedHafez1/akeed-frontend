import { ApiError } from '@/shared/lib/http'

export type TestVerificationFeedbackKey =
  | 'emptyState.onboarding.testFailed'
  | 'emptyState.onboarding.testPhoneInvalid'
  | 'emptyState.onboarding.testSourceUnavailable'
  | 'emptyState.onboarding.testEntitlementRequired'
  | 'emptyState.onboarding.testSetupIncomplete'
  | 'emptyState.onboarding.testRoleRequired'
  | 'emptyState.onboarding.testProviderFailed'
  | 'emptyState.onboarding.testRateLimited'

export function getTestVerificationFeedbackKey(
  error: unknown
): TestVerificationFeedbackKey {
  if (!(error instanceof ApiError)) {
    return 'emptyState.onboarding.testFailed'
  }

  if (error.status === 429) {
    return 'emptyState.onboarding.testRateLimited'
  }

  switch (error.code) {
    case 'TEST_VERIFICATION_INVALID_PHONE':
      return 'emptyState.onboarding.testPhoneInvalid'
    case 'TEST_VERIFICATION_SOURCE_UNAVAILABLE':
    case 'TEST_VERIFICATION_SOURCE_AMBIGUOUS':
      return 'emptyState.onboarding.testSourceUnavailable'
    case 'TEST_VERIFICATION_ENTITLEMENT_REQUIRED':
      return 'emptyState.onboarding.testEntitlementRequired'
    case 'TEST_VERIFICATION_SETUP_INCOMPLETE':
      return 'emptyState.onboarding.testSetupIncomplete'
    case 'TEST_VERIFICATION_ROLE_REQUIRED':
      return 'emptyState.onboarding.testRoleRequired'
    case 'TEST_VERIFICATION_PROVIDER_FAILED':
      return 'emptyState.onboarding.testProviderFailed'
    default:
      return 'emptyState.onboarding.testFailed'
  }
}
