'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  completeStandaloneOnboarding,
  OnboardingApiError,
} from '@/features/onboarding/api/onboardingApi'
import type {
  IntegrationOnboardingState,
  SetupBlockedReason,
} from '@/features/onboarding/domain/onboarding.types'
import { createLogger } from '@/shared/lib/logger'
import {
  useOnboardingTest,
  type OnboardingTestError,
} from './useOnboardingTest'

const logger = createLogger('Onboarding')

/** Why the send that opened the test step failed, if it did. */
export type OnboardingTestSendError = OnboardingTestError | 'unavailable'

interface OnboardingTestCompletionOptions {
  /** The flow is loaded and its test step is the one to show. */
  isTestStep: boolean
  dashboardPath: string
  /** The URL the finished flow rests on, without navigating. */
  doneUrl: () => string
  messages: { readOnly: string; completeError: string }
  onCompleted: (state: IntegrationOnboardingState) => void
  /** `/complete` answered with reasons; the flow shows them. */
  onBlocked: (reasons: SetupBlockedReason[]) => void
  onChangeNumber: () => void
}

/**
 * The second half of every non-embedded setup flow, whatever the source: the
 * free test on the merchant's phone, then `/complete`.
 *
 * `/complete` is only ever called after the test is confirmed, skipped, or
 * Akeed's WhatsApp is unavailable. The finished screen replaces the history
 * entry and never navigates, so the route guard does not bounce a
 * just-completed account off the setup route.
 */
export function useOnboardingTestCompletion({
  isTestStep,
  dashboardPath,
  doneUrl,
  messages,
  onCompleted,
  onBlocked,
  onChangeNumber,
}: OnboardingTestCompletionOptions) {
  const router = useRouter()
  const [submitTestError, setSubmitTestError] =
    useState<OnboardingTestSendError | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)
  const isActive = isTestStep && !isDone
  const { readOnly, completeError: completeErrorMessage } = messages

  const complete = useCallback(async (): Promise<boolean> => {
    setCompleteError(null)
    setIsCompleting(true)
    try {
      const response = await completeStandaloneOnboarding()
      onCompleted(response.state)
      return true
    } catch (error) {
      logger.error('Failed to complete onboarding', error)
      if (error instanceof OnboardingApiError) {
        if (error.status === 403) {
          setCompleteError(readOnly)
          return false
        }
        if (error.blockedReasons.length > 0) {
          onBlocked(error.blockedReasons)
          return false
        }
      }
      setCompleteError(completeErrorMessage)
      return false
    } finally {
      setIsCompleting(false)
    }
  }, [completeErrorMessage, onBlocked, onCompleted, readOnly])

  const isActiveRef = useRef(isActive)
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])
  /** What a failed /complete was finishing, so its retry repeats it. */
  const completionIntentRef = useRef<'confirmed' | 'leave' | null>(null)

  const finishConfirmed = useCallback(async () => {
    completionIntentRef.current = 'confirmed'
    if (!(await complete())) return
    setIsDone(true)
    window.history.replaceState(null, '', doneUrl())
  }, [complete, doneUrl])

  const handleTestConfirmed = useCallback(() => {
    if (!isActiveRef.current) return
    void finishConfirmed()
  }, [finishConfirmed])

  const leaveToDashboard = useCallback(async () => {
    completionIntentRef.current = 'leave'
    if (await complete()) router.replace(dashboardPath)
  }, [complete, dashboardPath, router])

  const handleSkipped = useCallback(() => {
    void leaveToDashboard()
  }, [leaveToDashboard])

  const retryCompletion = useCallback(() => {
    if (completionIntentRef.current === 'confirmed') void finishConfirmed()
    else if (completionIntentRef.current === 'leave') void leaveToDashboard()
  }, [finishConfirmed, leaveToDashboard])

  const neverFreshSendRef = useRef(false)
  const test = useOnboardingTest({
    isActive,
    freshSendRequestedRef: neverFreshSendRef,
    onConfirmed: handleTestConfirmed,
    onSkipped: handleSkipped,
    autoSend: false,
  })

  const { resend } = test
  const retryTest = useCallback(() => {
    setSubmitTestError(null)
    resend()
  }, [resend])

  const changeNumber = useCallback(() => {
    setSubmitTestError(null)
    setCompleteError(null)
    onChangeNumber()
  }, [onChangeNumber])

  const testError =
    test.error ??
    (submitTestError && submitTestError !== 'unavailable'
      ? submitTestError
      : null)
  const isTestUnavailable =
    test.isUnavailable || submitTestError === 'unavailable'

  return {
    isDone,
    setSubmitTestError,
    test: useMemo(
      () => ({
        testState: test.testState,
        isLoading: test.isLoading,
        isSending: test.isSending,
        isSkipping: test.isSkipping,
        error: testError,
        isUnavailable: isTestUnavailable,
        retry: retryTest,
        skip: test.skip,
        changeNumber,
        continueToDashboard: () => void leaveToDashboard(),
      }),
      [
        changeNumber,
        isTestUnavailable,
        leaveToDashboard,
        retryTest,
        test.isLoading,
        test.isSending,
        test.isSkipping,
        test.skip,
        test.testState,
        testError,
      ]
    ),
    completion: {
      isCompleting,
      error: completeError,
      retry: retryCompletion,
    },
  }
}

export type OnboardingTestCompletion = ReturnType<
  typeof useOnboardingTestCompletion
>
