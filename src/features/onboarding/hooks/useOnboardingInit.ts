'use client'

import { useEffect, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
} from '@/features/onboarding/api/onboardingApi'
import type {
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/features/onboarding/domain/onboarding.types'
import type { EmbeddedStep } from '../model/onboarding.config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingStatusMessages {
  billingStatusPending: string
  billingStatusDeclined: string
  billingStatusFrozen: string
  billingStatusExpired: string
  billingStatusCanceled: string
  billingStatusError: string
  billingStatusNeedsAttention: string
}

export interface UseOnboardingInitParams {
  isEmbedded: boolean
  isModeLoading: boolean
  locale: string
  router: AppRouterInstance
  prefillWarningMessage: string
  billingStatusMessages: BillingStatusMessages
  setStep: (step: EmbeddedStep) => void
  setErrorBanner: (message: string | null) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeBillingStatus(status: string | null): string | null {
  if (!status) return null
  const normalized = status.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function resolveBillingRecoveryMessage(
  status: string,
  messages: BillingStatusMessages
): string | null {
  if (status === 'active' || status === 'not_required') return null
  if (status === 'pending') return messages.billingStatusPending
  if (status === 'declined') return messages.billingStatusDeclined
  if (status === 'frozen') return messages.billingStatusFrozen
  if (status === 'expired') return messages.billingStatusExpired
  if (status === 'cancelled' || status === 'canceled')
    return messages.billingStatusCanceled
  if (status === 'error') return messages.billingStatusError
  return messages.billingStatusNeedsAttention
}

function resolveResumeStep(state: IntegrationOnboardingState): EmbeddedStep {
  const hasBillingActivity =
    state.billingPlanId !== null || state.billingStatus !== null
  if (hasBillingActivity) return 3

  const hasConfigProgress =
    state.storeName !== null && state.storeName.trim().length > 0
  if (hasConfigProgress) return 2

  return 1
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Handles the initial data-load for the embedded onboarding flow.
 *
 * Fetches onboarding state and billing plans on mount, resolves the correct
 * resume step, and surfaces prefill warnings or billing recovery errors.
 * Sets initial field values for Settings and Billing to consume.
 */
export function useOnboardingInit({
  isEmbedded,
  isModeLoading,
  locale,
  router,
  prefillWarningMessage,
  billingStatusMessages,
  setStep,
  setErrorBanner,
}: UseOnboardingInitParams) {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [initialStoreName, setInitialStoreName] = useState('')
  const [initialDefaultLanguage, setInitialDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>('auto')
  const [initialIsAutoVerifyEnabled, setInitialIsAutoVerifyEnabled] =
    useState(true)
  const [billingManagementUrl, setBillingManagementUrl] = useState<
    string | null
  >(null)
  const [billingPlanConfigsById, setBillingPlanConfigsById] = useState<
    Partial<Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>>
  >({})
  const [prefillWarning, setPrefillWarning] = useState<string | null>(null)
  const {
    billingStatusPending,
    billingStatusDeclined,
    billingStatusFrozen,
    billingStatusExpired,
    billingStatusCanceled,
    billingStatusError,
    billingStatusNeedsAttention,
  } = billingStatusMessages

  /**
   * Ref used by useOnboardingSettings to know whether to skip auto-save
   * on the very first render (before init has populated field values).
   */
  const hasCompletedInitRef = useRef(false)

  useEffect(() => {
    if (isModeLoading) return

    if (!isEmbedded) {
      setIsInitialLoading(false)
      return
    }

    let active = true

    const load = async () => {
      setIsInitialLoading(true)
      setErrorBanner(null)

      try {
        const [stateResponse, billingPlansResponse] = await Promise.all([
          fetchOnboardingState(),
          fetchOnboardingBillingPlans().catch((error) => {
            console.error('[Onboarding] Failed to load billing plans:', error)
            return null
          }),
        ])

        const { state } = stateResponse
        if (!active) return

        if (state.onboardingStatus === 'completed') {
          router.replace(`/${locale}/dashboard${window.location.search}`)
          return
        }

        setInitialStoreName(state.storeName ?? '')
        setInitialDefaultLanguage(state.defaultLanguage)
        setInitialIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
        setBillingManagementUrl(state.billingManagementUrl)

        const normalizedBillingStatus = normalizeBillingStatus(
          state.billingStatus
        )
        const billingRecoveryMessage = normalizedBillingStatus
          ? resolveBillingRecoveryMessage(
              normalizedBillingStatus,
              {
                billingStatusPending,
                billingStatusDeclined,
                billingStatusFrozen,
                billingStatusExpired,
                billingStatusCanceled,
                billingStatusError,
                billingStatusNeedsAttention,
              }
            )
          : null

        if (billingRecoveryMessage) {
          setErrorBanner(billingRecoveryMessage)
          setStep(3)
        } else {
          const resumeStep = resolveResumeStep(state)
          if (resumeStep !== 1) setStep(resumeStep)
        }

        if (billingPlansResponse) {
          const plansById: Partial<
            Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>
          > = {}
          for (const plan of billingPlansResponse.plans) {
            plansById[plan.id] = plan
          }
          setBillingPlanConfigsById(plansById)
        } else {
          setBillingPlanConfigsById({})
        }
      } catch (error) {
        console.error('[Onboarding] Failed to load state:', error)

        if (active) {
          setPrefillWarning(prefillWarningMessage)
          setInitialDefaultLanguage('auto')
          setInitialIsAutoVerifyEnabled(true)
        }
      } finally {
        if (active) {
          setIsInitialLoading(false)
          hasCompletedInitRef.current = true
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [
    isEmbedded,
    isModeLoading,
    locale,
    prefillWarningMessage,
    billingStatusPending,
    billingStatusDeclined,
    billingStatusFrozen,
    billingStatusExpired,
    billingStatusCanceled,
    billingStatusError,
    billingStatusNeedsAttention,
    router,
    setStep,
    setErrorBanner,
  ])

  return {
    isInitialLoading,
    initialStoreName,
    initialDefaultLanguage,
    initialIsAutoVerifyEnabled,
    billingManagementUrl,
    billingPlanConfigsById,
    prefillWarning,
    hasCompletedInitRef,
  }
}
