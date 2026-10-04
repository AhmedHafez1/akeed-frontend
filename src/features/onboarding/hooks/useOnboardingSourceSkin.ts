'use client'

import { useState } from 'react'
import {
  getKnownOnboardingSource,
  getKnownSignupSource,
  type KnownOnboardingSource,
} from '@/features/onboarding/api/onboardingApi'

export type OnboardingSourceSkin = 'standalone' | 'easyorders'

/** Sources with their own setup skin; every other source uses Standalone's. */
const SKIN_BY_PLATFORM = new Map<string, OnboardingSourceSkin>([
  ['easyorders', 'easyorders'],
])

/**
 * The skin for an organization with no source yet, by the store platform
 * chosen at signup. EasyOrders was the first such platform and stays the
 * answer when the choice is not known.
 */
const CONNECT_SKIN_BY_SIGNUP_SOURCE = new Map<string, OnboardingSourceSkin>([
  ['easyorders', 'easyorders'],
])
const DEFAULT_CONNECT_SKIN: OnboardingSourceSkin = 'easyorders'

export function resolveOnboardingSourceSkin(
  source: KnownOnboardingSource,
  signupSourceId: string | null = null
): OnboardingSourceSkin {
  if (source === 'missing')
    return (
      (signupSourceId && CONNECT_SKIN_BY_SIGNUP_SOURCE.get(signupSourceId)) ||
      DEFAULT_CONNECT_SKIN
    )
  if (source === null) return 'standalone'
  return SKIN_BY_PLATFORM.get(source.platformType) ?? 'standalone'
}

/**
 * Which non-embedded setup skin to mount, from the source the route guard
 * already read. Decided once per mount: the connect skin stays up while the
 * source goes from missing to connected. Unknown means Standalone, which
 * loads the state itself and reports its own errors.
 */
export function useOnboardingSourceSkin(): OnboardingSourceSkin {
  const [skin] = useState(() =>
    resolveOnboardingSourceSkin(
      getKnownOnboardingSource(),
      getKnownSignupSource()
    )
  )
  return skin
}
