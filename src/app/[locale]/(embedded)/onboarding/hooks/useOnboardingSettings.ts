'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { updateOnboardingSettings } from '@/lib/onboarding'
import type { IntegrationOnboardingLanguage } from '@/types/embedded-onboarding.model'
import type { EmbeddedStep } from '../onboarding.config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseOnboardingSettingsParams {
  step: EmbeddedStep
  setStep: (step: EmbeddedStep) => void
  setErrorBanner: (message: string | null) => void
  storeNameRequiredMessage: string
  settingsSaveErrorMessage: string
  /** Ref from useOnboardingInit — prevents auto-save before init completes */
  hasCompletedInitRef: RefObject<boolean>
  /** Initial values seeded from the server by useOnboardingInit */
  initialStoreName: string
  initialDefaultLanguage: IntegrationOnboardingLanguage
  initialIsAutoVerifyEnabled: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages step-2 settings form state (store name, language, auto-verify)
 * and the debounced auto-save effect.
 *
 * Receives `setStep` and `setErrorBanner` from the coordinator so it can
 * advance the flow and surface errors without owning those state variables.
 */
export function useOnboardingSettings({
  step,
  setStep,
  setErrorBanner,
  storeNameRequiredMessage,
  settingsSaveErrorMessage,
  hasCompletedInitRef,
  initialStoreName,
  initialDefaultLanguage,
  initialIsAutoVerifyEnabled,
}: UseOnboardingSettingsParams) {
  const [storeName, setStoreName] = useState(initialStoreName)
  const [storeNameError, setStoreNameError] = useState<string | undefined>()
  const [defaultLanguage, setDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>(initialDefaultLanguage)
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(
    initialIsAutoVerifyEnabled
  )
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Sync initial values once init data lands (they arrive async from the server)
  useEffect(() => {
    setStoreName(initialStoreName)
  }, [initialStoreName])

  useEffect(() => {
    setDefaultLanguage(initialDefaultLanguage)
  }, [initialDefaultLanguage])

  useEffect(() => {
    setIsAutoVerifyEnabled(initialIsAutoVerifyEnabled)
  }, [initialIsAutoVerifyEnabled])

  // Debounced auto-save: persist step-2 field changes to the backend
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
  }, [
    step,
    storeName,
    defaultLanguage,
    isAutoVerifyEnabled,
    hasCompletedInitRef,
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
    setStep,
    setErrorBanner,
  ])

  return {
    storeName,
    storeNameError,
    defaultLanguage,
    setDefaultLanguage,
    isAutoVerifyEnabled,
    setIsAutoVerifyEnabled,
    isSavingSettings,
    handleStoreNameChange,
    handleContinueToBilling,
  }
}
