'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import {
  completeOnboardingSetup,
  OnboardingApiError,
  updateOnboardingSettings,
} from '@/features/onboarding/api/onboardingApi'
import { setCachedOnboardingStatus } from '@/features/onboarding/lib/embeddedAuth'
import { createLogger } from '@/shared/lib/logger'
import { isValidPhoneNumber } from '@/shared/ui/international-phone-input'
import type {
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
} from '@/features/onboarding/domain/onboarding.types'
import type { EmbeddedStep } from '../model/onboarding.config'

const logger = createLogger('Onboarding')

export interface SetupFormMessages {
  storeNameRequired: string
  phoneInvalid: string
  setupSaveError: string
}

export interface UseOnboardingSettingsParams {
  step: EmbeddedStep
  setStep: (step: EmbeddedStep) => void
  setErrorBanner: (message: string | null) => void
  messages: SetupFormMessages
  /** Ref from useOnboardingInit: no autosave before init completes. */
  hasCompletedInitRef: RefObject<boolean>
  initialStoreName: string
  initialDefaultLanguage: IntegrationOnboardingLanguage
  initialIsAutoVerifyEnabled: boolean
  initialMerchantPhone: string
}

/**
 * Quick setup form: store name, customer message language, the merchant's own
 * WhatsApp number and auto-confirm. Drafts autosave; submitting saves setup,
 * which takes the store live, and moves on to the test message.
 */
export function useOnboardingSettings({
  step,
  setStep,
  setErrorBanner,
  messages,
  hasCompletedInitRef,
  initialStoreName,
  initialDefaultLanguage,
  initialIsAutoVerifyEnabled,
  initialMerchantPhone,
}: UseOnboardingSettingsParams) {
  const queryClient = useQueryClient()
  const [storeName, setStoreName] = useState(initialStoreName)
  const [storeNameError, setStoreNameError] = useState<string | undefined>()
  const [defaultLanguage, setDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>(initialDefaultLanguage)
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(
    initialIsAutoVerifyEnabled
  )
  const [merchantPhone, setMerchantPhone] = useState(initialMerchantPhone)
  const [phoneError, setPhoneError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedState, setCompletedState] =
    useState<IntegrationOnboardingState | null>(null)

  useEffect(() => setStoreName(initialStoreName), [initialStoreName])
  useEffect(
    () => setDefaultLanguage(initialDefaultLanguage),
    [initialDefaultLanguage]
  )
  useEffect(
    () => setIsAutoVerifyEnabled(initialIsAutoVerifyEnabled),
    [initialIsAutoVerifyEnabled]
  )
  useEffect(
    () => setMerchantPhone(initialMerchantPhone),
    [initialMerchantPhone]
  )

  useEffect(() => {
    if (!hasCompletedInitRef.current || step !== 'setup') return

    const trimmed = storeName.trim()
    if (!trimmed) return

    const timeoutId = setTimeout(() => {
      void updateOnboardingSettings({
        storeName: trimmed,
        defaultLanguage,
        isAutoVerifyEnabled,
        ...(isValidPhoneNumber(merchantPhone)
          ? { merchantWhatsappPhone: merchantPhone }
          : {}),
      }).catch((error: unknown) => {
        logger.error('Auto-save failed', error)
      })
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [
    step,
    storeName,
    defaultLanguage,
    isAutoVerifyEnabled,
    merchantPhone,
    hasCompletedInitRef,
  ])

  const handleStoreNameChange = useCallback((value: string) => {
    setStoreName(value)
    if (value.trim().length > 0) setStoreNameError(undefined)
  }, [])

  const handleMerchantPhoneChange = useCallback((value: string) => {
    setMerchantPhone(value)
    setPhoneError(undefined)
  }, [])

  const handleSubmitSetup = useCallback(async () => {
    setErrorBanner(null)

    const trimmedStoreName = storeName.trim()
    const storeNameMissing = !trimmedStoreName
    const phoneInvalid = !isValidPhoneNumber(merchantPhone)
    setStoreNameError(storeNameMissing ? messages.storeNameRequired : undefined)
    setPhoneError(phoneInvalid ? messages.phoneInvalid : undefined)
    if (storeNameMissing || phoneInvalid) return

    setIsSubmitting(true)
    try {
      const { state } = await completeOnboardingSetup({
        storeName: trimmedStoreName,
        defaultLanguage,
        isAutoVerifyEnabled,
        merchantWhatsappPhone: merchantPhone,
      })
      setCachedOnboardingStatus('completed')
      setCompletedState(state)
      queryClient.setQueryData(queryKeys.onboarding.state(), { state })
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.billing.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.verifications.all,
        }),
      ])
      setStep(
        state.activation?.needsPlan ||
          state.sendingAvailability?.reason === 'billing_not_active'
          ? 'plans'
          : 'test'
      )
    } catch (error) {
      logger.error('Failed to complete setup', error)
      if (
        error instanceof OnboardingApiError &&
        error.code === 'ONBOARDING_INVALID_PHONE'
      ) {
        setPhoneError(messages.phoneInvalid)
      } else {
        setErrorBanner(messages.setupSaveError)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [
    defaultLanguage,
    isAutoVerifyEnabled,
    merchantPhone,
    messages,
    setErrorBanner,
    setStep,
    storeName,
    queryClient,
  ])

  return {
    completedState,
    storeName,
    storeNameError,
    defaultLanguage,
    setDefaultLanguage,
    isAutoVerifyEnabled,
    setIsAutoVerifyEnabled,
    merchantPhone,
    phoneError,
    isSubmitting,
    handleStoreNameChange,
    handleMerchantPhoneChange,
    handleSubmitSetup,
  }
}
