'use client'

import { useQuery } from '@tanstack/react-query'
import { activationStateOptions } from '../api/activationQueries'
import {
  resolveStandaloneFirstRun,
  shouldShowSkippedTestReminder,
} from '../model/activation.model'

/**
 * Whether the standalone dashboard is still waiting for its first real order,
 * and whether the merchant skipped the onboarding test. The top bar and the
 * overview read the same cached onboarding state. A state that failed to load
 * counts as active, so a network error never hides the order actions.
 */
export function useStandaloneFirstRun() {
  const { data, isError } = useQuery(activationStateOptions())
  return {
    status: isError && !data ? 'active' : resolveStandaloneFirstRun(data),
    showSkippedTestReminder: shouldShowSkippedTestReminder(data?.activation),
  } as const
}
