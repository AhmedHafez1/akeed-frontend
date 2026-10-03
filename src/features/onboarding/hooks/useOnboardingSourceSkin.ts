'use client'

import { useState } from 'react'
import {
  getKnownOnboardingSource,
  type KnownOnboardingSource,
} from '@/features/onboarding/api/onboardingApi'

export type OnboardingSourceSkin = 'standalone' | 'easyorders'

/** Sources with their own setup skin; every other source uses Standalone's. */
const SKIN_BY_PLATFORM: Record<string, OnboardingSourceSkin> = {
  easyorders: 'easyorders',
}

/**
 * The skin for an organization with no source yet: signup chose a store
 * platform to connect. EasyOrders is the only one today.
 */
const CONNECT_SKIN: OnboardingSourceSkin = 'easyorders'

export function resolveOnboardingSourceSkin(
  source: KnownOnboardingSource
): OnboardingSourceSkin {
  if (source === 'missing') return CONNECT_SKIN
  if (source === null) return 'standalone'
  return SKIN_BY_PLATFORM[source.platformType] ?? 'standalone'
}

/**
 * Which non-embedded setup skin to mount, from the source the route guard
 * already read. Decided once per mount: the connect skin stays up while the
 * source goes from missing to connected. Unknown means Standalone, which
 * loads the state itself and reports its own errors.
 */
export function useOnboardingSourceSkin(): OnboardingSourceSkin {
  const [skin] = useState(() =>
    resolveOnboardingSourceSkin(getKnownOnboardingSource())
  )
  return skin
}
