import {
  SOURCE_SETUP_STEPS,
  type SourceSetupStep,
} from '@/features/onboarding/domain/onboarding.types'
import type { OnboardingSourceSkin } from '@/features/onboarding/hooks/useOnboardingSourceSkin'

export type OnboardingProgressStepId =
  | 'account'
  | Exclude<SourceSetupStep, 'done'>

/** A step's name, under `standaloneOnboarding.flow`. */
export type OnboardingProgressTitleKey =
  | 'account'
  | 'store'
  | 'connectStore'
  | 'details'
  | 'number'
  | 'test'

interface ProgressStepDefinition {
  id: OnboardingProgressStepId
  titleKey: OnboardingProgressTitleKey
}

const ACCOUNT: ProgressStepDefinition = { id: 'account', titleKey: 'account' }
const CONNECT: ProgressStepDefinition = {
  id: 'connect',
  titleKey: 'connectStore',
}
const TEST: ProgressStepDefinition = { id: 'test', titleKey: 'test' }

/**
 * The steps of setup, by source. Every source shares the `?step=` values, so
 * the shell's stepper only needs this list to follow the page: a connected
 * store adds "Connect your store", and a platform that needs details of its
 * own adds one more.
 */
export const ONBOARDING_PROGRESS_STEPS: Record<
  OnboardingSourceSkin,
  readonly ProgressStepDefinition[]
> = {
  standalone: [ACCOUNT, { id: 'store', titleKey: 'store' }, TEST],
  woocommerce: [ACCOUNT, CONNECT, { id: 'store', titleKey: 'number' }, TEST],
  easyorders: [
    ACCOUNT,
    CONNECT,
    { id: 'details', titleKey: 'details' },
    { id: 'store', titleKey: 'number' },
    TEST,
  ],
}

export function parseSourceSetupStep(
  value: string | null | undefined
): SourceSetupStep | null {
  return SOURCE_SETUP_STEPS.includes(value as SourceSetupStep)
    ? (value as SourceSetupStep)
    : null
}

export interface OnboardingProgressStep extends ProgressStepDefinition {
  state: 'done' | 'current' | 'upcoming'
}

export interface OnboardingProgress {
  steps: OnboardingProgressStep[]
  /** 1-based position of the step on screen. */
  current: number
  total: number
  titleKey: OnboardingProgressTitleKey
  /** 0–1, for the phone-width bar; full once setup is finished. */
  fraction: number
}

/**
 * Where setup stands for a source, from the page's `?step`. The account step
 * is always done: nobody reaches setup without one. A step the source does
 * not have, or none at all, means its first step after the account.
 */
export function resolveOnboardingProgress(
  skin: OnboardingSourceSkin,
  requested: string | null | undefined
): OnboardingProgress {
  const definitions = ONBOARDING_PROGRESS_STEPS[skin]
  const step = parseSourceSetupStep(requested)
  const isFinished = step === 'done'
  const found = definitions.findIndex((definition) => definition.id === step)
  const index = isFinished ? definitions.length - 1 : found > 0 ? found : 1

  return {
    steps: definitions.map((definition, position) => ({
      ...definition,
      state:
        position < index || isFinished
          ? 'done'
          : position === index
            ? 'current'
            : 'upcoming',
    })),
    current: index + 1,
    total: definitions.length,
    titleKey: definitions[index].titleKey,
    fraction: isFinished ? 1 : (index + 1) / definitions.length,
  }
}
