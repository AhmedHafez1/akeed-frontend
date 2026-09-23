'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchOnboardingTest,
  OnboardingApiError,
  sendOnboardingTest,
  skipOnboardingTest,
} from '@/features/onboarding/api/onboardingApi'
import { queryKeys } from '@/shared/query/keys'
import { createLogger } from '@/shared/lib/logger'
import type {
  OnboardingTestState,
  OnboardingTestStatus,
} from '@/features/onboarding/domain/onboarding.types'
import { ONBOARDING_TEST_POLL_INTERVAL_MS } from '../model/onboarding.config'

const logger = createLogger('Onboarding')

/** Statuses after which nothing more will arrive for this test. */
const SETTLED_STATUSES: ReadonlySet<OnboardingTestStatus> = new Set([
  'confirmed',
  'failed',
  'expired',
])

/** A still-open test younger than this is resumed instead of sent again. */
const RESUME_WINDOW_MS = 10 * 60 * 1000

export type OnboardingTestError =
  | 'cooldown'
  | 'daily_limit'
  | 'phone_missing'
  | 'send_failed'
  | 'skip_failed'

function toTestError(error: unknown): OnboardingTestError {
  if (error instanceof OnboardingApiError) {
    if (error.code === 'ONBOARDING_TEST_COOLDOWN') return 'cooldown'
    if (error.code === 'ONBOARDING_TEST_DAILY_LIMIT') return 'daily_limit'
    if (error.code === 'ONBOARDING_TEST_PHONE_MISSING') return 'phone_missing'
  }
  return 'send_failed'
}

interface UseOnboardingTestParams {
  isActive: boolean
  /**
   * Set when setup was just (re)submitted: the number may have changed, so a
   * fresh test goes out even if an earlier one is still open.
   */
  freshSendRequestedRef: RefObject<boolean>
  onConfirmed: () => void
  onSkipped: () => void
}

/**
 * The test-message step: sends the free test once on arrival (unless one is
 * already on its way), polls its delivery status until the merchant taps
 * Confirm, and exposes resend (server-enforced cooldown) and skip.
 */
export function useOnboardingTest({
  isActive,
  freshSendRequestedRef,
  onConfirmed,
  onSkipped,
}: UseOnboardingTestParams) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<OnboardingTestError | null>(null)
  const hasAutoSentRef = useRef(false)
  const hasReportedConfirmRef = useRef(false)

  const testQuery = useQuery({
    queryKey: queryKeys.onboarding.test(),
    queryFn: fetchOnboardingTest,
    enabled: isActive,
    refetchOnWindowFocus: 'always',
    refetchInterval: (query) => {
      const status = query.state.data?.test?.status
      if (!status || SETTLED_STATUSES.has(status)) return false
      return ONBOARDING_TEST_POLL_INTERVAL_MS
    },
  })

  const storeResult = useCallback(
    (state: OnboardingTestState) =>
      queryClient.setQueryData(queryKeys.onboarding.test(), state),
    [queryClient]
  )

  const sendMutation = useMutation({
    mutationFn: (resend: boolean) => sendOnboardingTest({ resend }),
    onMutate: () => setError(null),
    onSuccess: storeResult,
    onError: (sendError: unknown) => {
      logger.error('Failed to send onboarding test', sendError)
      setError(toTestError(sendError))
      void queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.test(),
      })
    },
  })

  const skipMutation = useMutation({
    mutationFn: skipOnboardingTest,
    onSuccess: (state) => {
      storeResult(state)
      onSkipped()
    },
    onError: (skipError: unknown) => {
      logger.error('Failed to skip onboarding test', skipError)
      setError('skip_failed')
    },
  })

  const data = testQuery.data
  const { mutate: send } = sendMutation

  useEffect(() => {
    if (!isActive || !data) return
    if (freshSendRequestedRef.current) {
      freshSendRequestedRef.current = false
      hasAutoSentRef.current = true
      send(false)
      return
    }
    if (hasAutoSentRef.current) return
    hasAutoSentRef.current = true
    if (data.testConfirmedAt) return
    const sentAt = data.test?.sentAt ? new Date(data.test.sentAt).getTime() : 0
    const isRecentAndOpen =
      !!data.test &&
      !SETTLED_STATUSES.has(data.test.status) &&
      Date.now() - sentAt < RESUME_WINDOW_MS
    if (!isRecentAndOpen) send(false)
  }, [data, freshSendRequestedRef, isActive, send])

  useEffect(() => {
    if (!data || hasReportedConfirmRef.current) return
    if (data.test?.status === 'confirmed') {
      hasReportedConfirmRef.current = true
      onConfirmed()
    }
  }, [data, onConfirmed])

  const resend = useCallback(() => send(true), [send])
  const skip = useCallback(() => skipMutation.mutate(), [skipMutation])

  return {
    testState: data ?? null,
    isLoading: testQuery.isLoading,
    isSending: sendMutation.isPending,
    isSkipping: skipMutation.isPending,
    error,
    resend,
    skip,
  }
}
