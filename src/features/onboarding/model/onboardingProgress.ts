import type { OnboardingSourceSkin } from '@/features/onboarding/hooks/useOnboardingSourceSkin'

/**
 * The name of the middle step of setup (Account · this · Try the message),
 * under `standaloneOnboarding.flow`. Every source uses the same `?step=`
 * values, so the shell's stepper only needs to know what to call this step.
 */
export const ONBOARDING_STORE_STEP_TITLE: Record<
  OnboardingSourceSkin,
  'store' | 'connectStore'
> = {
  standalone: 'store',
  easyorders: 'connectStore',
}
