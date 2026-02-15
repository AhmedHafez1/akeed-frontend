'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
  createOnboardingBilling,
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
  updateOnboardingSettings,
} from '@/lib/onboarding'
import type {
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/types/embedded-onboarding.model'

type EmbeddedStep = 1 | 2 | 3

interface EmbeddedOnboardingMessages {
  prefillWarning: string
  storeNameRequired: string
  settingsSaveError: string
  billingActivationError: string
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

export function useEmbeddedOnboarding({
  isEmbedded,
  isModeLoading,
  locale,
  hostParam,
  router,
  messages,
  onBillingConfirmation,
}: UseEmbeddedOnboardingParams) {
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
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [prefillWarning, setPrefillWarning] = useState<string | null>(null)

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
          setPrefillWarning(messages.prefillWarning)
          setDefaultLanguage('auto')
          setIsAutoVerifyEnabled(true)
        }
      } finally {
        if (active) {
          setIsInitialLoading(false)
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
    messages.prefillWarning,
    router,
  ])

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
      setStoreNameError(messages.storeNameRequired)
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
      setErrorBanner(messages.settingsSaveError)
    } finally {
      setIsSavingSettings(false)
    }
  }, [
    defaultLanguage,
    isAutoVerifyEnabled,
    messages.settingsSaveError,
    messages.storeNameRequired,
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
      onBillingConfirmation(confirmationUrl)
    } catch (error) {
      console.error('[Onboarding] Failed to activate billing:', error)
      setErrorBanner(messages.billingActivationError)
    } finally {
      setIsActivatingPlan(false)
    }
  }, [
    hostParam,
    messages.billingActivationError,
    onBillingConfirmation,
    selectedPlanId,
  ])

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
    errorBanner,
    prefillWarning,
    handleStoreNameChange,
    handleContinueToBilling,
    handleActivatePlan,
  }
}
