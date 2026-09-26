'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ApiError } from '@/shared/lib/http'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import { createLogger } from '@/shared/lib/logger'
import { useSendTestVerificationMutation } from '../api/verificationMutations'
import type { TestFeedback } from './dashboard.types'
import { getTestVerificationFeedbackKey } from './testVerificationFeedback'

const logger = createLogger('TestVerification')

/**
 * "Send a test to my phone": the send itself and the one line of feedback it
 * leaves, worded for why it was skipped or failed.
 */
export function useTestVerificationSend(canSendTestVerification: boolean) {
  const t = useTranslations('dashboard')
  const tCredits = useTranslations('creditErrors')
  const { mutateAsync: sendTestVerification } =
    useSendTestVerificationMutation()
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testFeedback, setTestFeedback] = useState<TestFeedback | null>(null)

  const onDismissTestFeedback = useCallback(() => setTestFeedback(null), [])

  const onSendTestVerification = useCallback(
    async (customerPhone: string) => {
      if (!canSendTestVerification) {
        setTestFeedback({
          tone: 'critical',
          message: t('emptyState.onboarding.testRoleRequired'),
        })
        return
      }
      const normalizedPhone = customerPhone.trim()
      if (!normalizedPhone) {
        setTestFeedback({
          tone: 'critical',
          message: t('emptyState.onboarding.testPhoneRequired'),
        })
        return
      }

      setIsSendingTest(true)
      setTestFeedback(null)
      try {
        const response = await sendTestVerification(normalizedPhone)
        if (response.skipped) {
          const creditKey = creditFeedbackKey(response.reason)
          setTestFeedback({
            tone: 'warning',
            message: creditKey
              ? tCredits(creditKey)
              : response.reason === 'plan_limit_reached'
                ? t('emptyState.onboarding.testQuotaReached')
                : t('emptyState.onboarding.testSkipped'),
          })
          return
        }
        setTestFeedback({
          tone: 'success',
          message: t('emptyState.onboarding.testSent'),
        })
      } catch (error) {
        logger.warn('Failed to send test verification', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        const creditKey =
          error instanceof ApiError ? creditFeedbackKey(error.code) : undefined
        setTestFeedback({
          tone: 'critical',
          message: creditKey
            ? tCredits(creditKey)
            : t(getTestVerificationFeedbackKey(error)),
          billingLink: Boolean(creditKey),
        })
      } finally {
        setIsSendingTest(false)
      }
    },
    [canSendTestVerification, sendTestVerification, t, tCredits]
  )

  return {
    isSendingTest,
    testFeedback,
    onSendTestVerification,
    onDismissTestFeedback,
  }
}
