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
  OnboardingTestReply,
  OnboardingTestState,
  OnboardingTestStatus,
} from '@/features/onboarding/domain/onboarding.types'
import { ONBOARDING_TEST_POLL_INTERVAL_MS } from '../model/onboarding.config'

const logger = createLogger('Onboarding')

/** Statuses after which nothing more will arrive for this test. */
const SETTLED_STATUSES: ReadonlySet<OnboardingTestStatus> = new Set([
  'confirmed',
  'canceled',
  'failed',
  'expired',
])

/**
 * The merchant's answer, if the test has one. A reply is final, so Cancel
 * finishes the test as surely as Confirm.
 */
export function resolveTestReply(
  state: OnboardingTestState | null | undefined
): OnboardingTestReply | null {
  const status = state?.test?.status
  if (status === 'confirmed' || status === 'canceled') return status
  // Set by the Shopify install lifecycle (always null for standalone): it
  // also counts a tap on an earlier message, which the displayed test never
  // reflects.
  return state?.testConfirmedAt ? 'confirmed' : null
}

/** A still-open test younger than this is resumed instead of sent again. */
const RESUME_WINDOW_MS = 10 * 60 * 1000

export type OnboardingTestError =
  | 'cooldown'
  | 'daily_limit'
  | 'phone_missing'
  | 'send_failed'
  | 'skip_failed'

export function toTestError(error: unknown): OnboardingTestError {
  if (error instanceof OnboardingApiError) {
    if (error.code === 'ONBOARDING_TEST_COOLDOWN') return 'cooldown'
    if (error.code === 'ONBOARDING_TEST_DAILY_LIMIT') return 'daily_limit'
    if (error.code === 'ONBOARDING_TEST_PHONE_MISSING') return 'phone_missing'
  }
  return 'send_failed'
}

/** Akeed's own WhatsApp sender failed: the problem is ours, not the number. */
export function isTestProviderUnavailable(error: unknown): boolean {
  return (
    error instanceof OnboardingApiError &&
    (error.code === 'TEST_VERIFICATION_PROVIDER_FAILED' || error.status >= 500)
  )
}

interface UseOnboardingTestParams {
  isActive: boolean
  /**
   * Set when setup was just (re)submitted: the number may have changed, so a
   * fresh test goes out even if an earlier one is still open.
   */
  freshSendRequestedRef: RefObject<boolean>
  onAnswered: (reply: OnboardingTestReply) => void
  onSkipped: () => void
  /**
   * Send a test on arrival when none is open. Standalone sends from its setup
   * submit instead, and a resumed test step waits for the merchant.
   */
  autoSend?: boolean
}

/**
 * The test-message step: sends the free test once on arrival (unless one is
 * already on its way), polls its delivery status until the merchant answers
 * (Confirm or Cancel), and exposes resend (server-enforced cooldown) and skip.
 */
export function useOnboardingTest({
  isActive,
  freshSendRequestedRef,
  onAnswered,
  onSkipped,
  autoSend = true,
}: UseOnboardingTestParams) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<OnboardingTestError | null>(null)
  const [isUnavailable, setIsUnavailable] = useState(false)
  const hasAutoSentRef = useRef(false)
  const hasReportedAnswerRef = useRef(false)

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
    onMutate: async () => {
      setError(null)
      setIsUnavailable(false)
      // The new message gets its own answer.
      hasReportedAnswerRef.current = false
      // A poll already in flight describes the previous message; landing
      // after this send it would put that one back on screen.
      await queryClient.cancelQueries({
        queryKey: queryKeys.onboarding.test(),
      })
    },
    onSuccess: storeResult,
    onError: (sendError: unknown) => {
      logger.error('Failed to send onboarding test', sendError)
      setError(toTestError(sendError))
      setIsUnavailable(isTestProviderUnavailable(sendError))
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
    if (hasAutoSentRef.current || !autoSend) return
    hasAutoSentRef.current = true
    if (resolveTestReply(data)) return
    const sentAt = data.test?.sentAt ? new Date(data.test.sentAt).getTime() : 0
    const isRecentAndOpen =
      !!data.test &&
      !SETTLED_STATUSES.has(data.test.status) &&
      Date.now() - sentAt < RESUME_WINDOW_MS
    if (!isRecentAndOpen) send(false)
  }, [autoSend, data, freshSendRequestedRef, isActive, send])

  useEffect(() => {
    // The query cache is shared: an inactive observer must not react to a
    // reply another flow is polling for.
    if (!isActive || !data || hasReportedAnswerRef.current) return
    const reply = resolveTestReply(data)
    if (reply) {
      hasReportedAnswerRef.current = true
      onAnswered(reply)
    }
  }, [data, isActive, onAnswered])

  const resend = useCallback(() => send(true), [send])
  const skip = useCallback(() => skipMutation.mutate(), [skipMutation])

  return {
    testState: data ?? null,
    isLoading: testQuery.isLoading,
    isSending: sendMutation.isPending,
    isSkipping: skipMutation.isPending,
    error,
    isUnavailable,
    resend,
    skip,
  }
}
