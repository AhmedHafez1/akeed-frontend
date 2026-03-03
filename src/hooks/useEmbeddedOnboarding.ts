'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
  createOnboardingBilling,
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
  updateOnboardingSettings,
} from '@/lib/onboarding'
import type {
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/types/embedded-onboarding.model'

type EmbeddedStep = 1 | 2 | 3

interface EmbeddedOnboardingMessages {
  prefillWarning: string
  storeNameRequired: string
  settingsSaveError: string
  billingActivationError: string
  billingStatusPending: string
  billingStatusDeclined: string
  billingStatusFrozen: string
  billingStatusExpired: string
  billingStatusCanceled: string
  billingStatusError: string
  billingStatusNeedsAttention: string
}

interface UseEmbeddedOnboardingParams {
  isEmbedded: boolean
  isModeLoading: boolean
  locale: string
  hostParam: string | null
  router: AppRouterInstance
  messages: EmbeddedOnboardingMessages
  onBillingConfirmation: (confirmationUrl: string) => void
}

interface BillingRecoveryMessages {
  billingStatusPending: string
  billingStatusDeclined: string
  billingStatusFrozen: string
  billingStatusExpired: string
  billingStatusCanceled: string
  billingStatusError: string
  billingStatusNeedsAttention: string
}

function normalizeBillingStatus(status: string | null): string | null {
  if (!status) {
    return null
  }

  const normalized = status.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function resolveBillingRecoveryMessage(
  status: string,
  messages: BillingRecoveryMessages
): string | null {
  if (status === 'active' || status === 'not_required') {
    return null
  }

  if (status === 'pending') {
    return messages.billingStatusPending
  }

  if (status === 'declined') {
    return messages.billingStatusDeclined
  }

  if (status === 'frozen') {
    return messages.billingStatusFrozen
  }

  if (status === 'expired') {
    return messages.billingStatusExpired
  }

  if (status === 'cancelled' || status === 'canceled') {
    return messages.billingStatusCanceled
  }

  if (status === 'error') {
    return messages.billingStatusError
  }

  return messages.billingStatusNeedsAttention
}

function resolveResumeStep(state: IntegrationOnboardingState): EmbeddedStep {
  const hasBillingActivity =
    state.billingPlanId !== null || state.billingStatus !== null
  if (hasBillingActivity) {
    return 3
  }

  const hasConfigProgress =
    state.storeName !== null && state.storeName.trim().length > 0
  if (hasConfigProgress) {
    return 2
  }

  return 1
}

export function useEmbeddedOnboarding({
  isEmbedded,
  isModeLoading,
  locale,
  hostParam,
  router,
  messages,
  onBillingConfirmation,
}: UseEmbeddedOnboardingParams) {
  const {
    prefillWarning: prefillWarningMessage,
    storeNameRequired: storeNameRequiredMessage,
    settingsSaveError: settingsSaveErrorMessage,
    billingActivationError: billingActivationErrorMessage,
    billingStatusPending: billingStatusPendingMessage,
    billingStatusDeclined: billingStatusDeclinedMessage,
    billingStatusFrozen: billingStatusFrozenMessage,
    billingStatusExpired: billingStatusExpiredMessage,
    billingStatusCanceled: billingStatusCanceledMessage,
    billingStatusError: billingStatusErrorMessage,
    billingStatusNeedsAttention: billingStatusNeedsAttentionMessage,
  } = messages

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [step, setStep] = useState<EmbeddedStep>(1)
  const [storeName, setStoreName] = useState('')
  const [storeNameError, setStoreNameError] = useState<string | undefined>()
  const [defaultLanguage, setDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>('auto')
  const [selectedPlanId, setSelectedPlanId] =
    useState<OnboardingBillingPlanId>('growth')
  const [billingPlanConfigsById, setBillingPlanConfigsById] = useState<
    Partial<Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>>
  >({})
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isActivatingPlan, setIsActivatingPlan] = useState(false)
  const [isBillingRedirecting, setIsBillingRedirecting] = useState(false)
  const [billingManagementUrl, setBillingManagementUrl] = useState<
    string | null
  >(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [prefillWarning, setPrefillWarning] = useState<string | null>(null)
  const hasCompletedInitRef = useRef(false)

  useEffect(() => {
    if (isModeLoading) return

    if (!isEmbedded) {
      setIsInitialLoading(false)
      return
    }

    let active = true

    const loadOnboardingState = async () => {
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

        setStoreName(state.storeName ?? '')
        setDefaultLanguage(state.defaultLanguage)
        setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
        setBillingManagementUrl(state.billingManagementUrl)

        const normalizedBillingStatus = normalizeBillingStatus(
          state.billingStatus
        )
        const billingRecoveryMessage = normalizedBillingStatus
          ? resolveBillingRecoveryMessage(normalizedBillingStatus, {
              billingStatusPending: billingStatusPendingMessage,
              billingStatusDeclined: billingStatusDeclinedMessage,
              billingStatusFrozen: billingStatusFrozenMessage,
              billingStatusExpired: billingStatusExpiredMessage,
              billingStatusCanceled: billingStatusCanceledMessage,
              billingStatusError: billingStatusErrorMessage,
              billingStatusNeedsAttention: billingStatusNeedsAttentionMessage,
            })
          : null
        if (billingRecoveryMessage) {
          setErrorBanner(billingRecoveryMessage)
          setStep(3)
        } else {
          const resumeStep = resolveResumeStep(state)
          if (resumeStep !== 1) {
            setStep(resumeStep)
          }
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
          setDefaultLanguage('auto')
          setIsAutoVerifyEnabled(true)
        }
      } finally {
        if (active) {
          setIsInitialLoading(false)
          hasCompletedInitRef.current = true
        }
      }
    }

    void loadOnboardingState()

    return () => {
      active = false
    }
  }, [
    isEmbedded,
    isModeLoading,
    locale,
    billingStatusCanceledMessage,
    billingStatusDeclinedMessage,
    billingStatusErrorMessage,
    billingStatusExpiredMessage,
    billingStatusFrozenMessage,
    billingStatusNeedsAttentionMessage,
    billingStatusPendingMessage,
    prefillWarningMessage,
    router,
  ])

  // Debounced auto-save: persist step 2 field changes to the backend
  useEffect(() => {
    if (!hasCompletedInitRef.current || step !== 2) return

    const trimmed = storeName.trim()
    if (!trimmed) return

    const timeoutId = setTimeout(() => {
      void updateOnboardingSettings({
        storeName: trimmed,
        defaultLanguage,
        isAutoVerifyEnabled,
      }).catch((error: unknown) => {
        console.error('[Onboarding] Auto-save failed:', error)
      })
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [step, storeName, defaultLanguage, isAutoVerifyEnabled])

  const handleStartSetup = useCallback(() => {
    setStep(2)
  }, [])

  const handleStoreNameChange = useCallback((value: string) => {
    setStoreName(value)
    if (value.trim().length > 0) {
      setStoreNameError(undefined)
    }
  }, [])

  const handleContinueToBilling = useCallback(async () => {
    setErrorBanner(null)

    const trimmedStoreName = storeName.trim()
    if (!trimmedStoreName) {
      setStoreNameError(storeNameRequiredMessage)
      return
    }

    setStoreNameError(undefined)
    setIsSavingSettings(true)

    try {
      await updateOnboardingSettings({
        storeName: trimmedStoreName,
        defaultLanguage,
        isAutoVerifyEnabled,
      })
      setStep(3)
    } catch (error) {
      console.error('[Onboarding] Failed to save settings:', error)
      setErrorBanner(settingsSaveErrorMessage)
    } finally {
      setIsSavingSettings(false)
    }
  }, [
    defaultLanguage,
    isAutoVerifyEnabled,
    settingsSaveErrorMessage,
    storeNameRequiredMessage,
    storeName,
  ])

  const handleActivatePlan = useCallback(async () => {
    setErrorBanner(null)
    setIsActivatingPlan(true)

    try {
      const { confirmationUrl } = await createOnboardingBilling(
        selectedPlanId,
        hostParam ?? undefined
      )
      setIsBillingRedirecting(true)
      onBillingConfirmation(confirmationUrl)
    } catch (error) {
      console.error('[Onboarding] Failed to activate billing:', error)
      setErrorBanner(billingActivationErrorMessage)
      setIsBillingRedirecting(false)
    } finally {
      setIsActivatingPlan(false)
    }
  }, [
    billingActivationErrorMessage,
    hostParam,
    onBillingConfirmation,
    selectedPlanId,
  ])

  const handleRetryBilling = useCallback(() => {
    setErrorBanner(null)
  }, [])

  const handleManageBilling = useCallback(() => {
    if (!billingManagementUrl) return

    if (window.top && window.top !== window.self) {
      window.open(billingManagementUrl, '_top')
    } else {
      window.location.href = billingManagementUrl
    }
  }, [billingManagementUrl])

  return {
    isInitialLoading,
    step,
    setStep,
    storeName,
    storeNameError,
    defaultLanguage,
    setDefaultLanguage,
    selectedPlanId,
    setSelectedPlanId,
    billingPlanConfigsById,
    isAutoVerifyEnabled,
    setIsAutoVerifyEnabled,
    isSavingSettings,
    isActivatingPlan,
    isBillingRedirecting,
    billingManagementUrl,
    errorBanner,
    prefillWarning,
    handleStoreNameChange,
    handleStartSetup,
    handleContinueToBilling,
    handleActivatePlan,
    handleRetryBilling,
    handleManageBilling,
  }
}
