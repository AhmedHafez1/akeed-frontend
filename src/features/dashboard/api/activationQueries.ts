import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import type { DashboardActivationState } from '../model/activation.model'

interface OnboardingStateEnvelope {
  state: DashboardActivationState
}

/**
 * The store's first-run state, read from the onboarding endpoint the setup
 * flow writes. Dashboard keeps its own view of it rather than importing the
 * onboarding feature; both meet on `queryKeys.onboarding.state`.
 */
export function activationStateOptions() {
  return queryOptions({
    queryKey: queryKeys.onboarding.state(),
    queryFn: ({ signal }) =>
      api.get<OnboardingStateEnvelope>('/api/onboarding/state', { signal }),
    select: (response) => response.state,
    // The first real confirmation arrives by webhook, so coming back to the
    // tab re-reads it instead of trusting a fresh-looking cache.
    refetchOnWindowFocus: 'always',
  })
}
