import type {
  StandaloneSetupFieldKey,
  StandaloneStep,
  StandaloneStepDefinition,
} from '@/features/onboarding/domain/onboarding.types'

export const STANDALONE_TOTAL_STEPS = 3

export const STANDALONE_STEPS: readonly StandaloneStepDefinition[] = [
  {
    id: 1,
    titleKey: 'steps.storeDetails.title',
    descriptionKey: 'steps.storeDetails.description',
    headingKey: 'steps.storeDetails.heading',
    subheadingKey: 'steps.storeDetails.subheading',
  },
  {
    id: 2,
    titleKey: 'steps.confirmationRules.title',
    descriptionKey: 'steps.confirmationRules.description',
    headingKey: 'steps.confirmationRules.heading',
    subheadingKey: 'steps.confirmationRules.subheading',
  },
  {
    id: 3,
    titleKey: 'steps.review.title',
    descriptionKey: 'steps.review.description',
    headingKey: 'steps.review.heading',
    subheadingKey: 'steps.review.subheading',
  },
] as const

/**
 * Which wizard step owns each validated field. `save()` always sends the full
 * payload, so a failure can belong to a step the user is not currently on —
 * the page uses this to navigate to the offending step instead of showing a
 * generic error.
 */
export const STANDALONE_FIELD_STEP: Record<
  StandaloneSetupFieldKey,
  StandaloneStep
> = {
  storeName: 1,
  sendDelayHours: 2,
  followUpDelayHours: 2,
  escalationDelayHours: 2,
  quietHours: 2,
}

/** Stable order used to resolve the "first" invalid field. */
export const STANDALONE_FIELD_ORDER: readonly StandaloneSetupFieldKey[] = [
  'storeName',
  'sendDelayHours',
  'followUpDelayHours',
  'escalationDelayHours',
  'quietHours',
] as const

/** DOM ids used for focus management after a failed advance or save. */
export const STANDALONE_FIELD_IDS: Record<StandaloneSetupFieldKey, string> = {
  storeName: 'onboarding-store-name',
  sendDelayHours: 'onboarding-send-delay',
  followUpDelayHours: 'onboarding-follow-up-delay',
  escalationDelayHours: 'onboarding-escalation-delay',
  quietHours: 'onboarding-quiet-hours-start',
}

export function getStepDefinition(step: StandaloneStep) {
  return STANDALONE_STEPS.find((definition) => definition.id === step)
}
