'use client'

import { useCallback, useMemo, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useOnboardingInit } from './useOnboardingInit'
import { useOnboardingSettings } from './useOnboardingSettings'
import { useOnboardingBilling } from './useOnboardingBilling'
import type { EmbeddedStep } from '../model/onboarding.config'

/**
 * Embedded Onboarding — Coordinator Hook
 *
 * Owns only the shared cross-concern state (`step`, `errorBanner`) and
 * delegates all domain logic to three focused sub-hooks:
 *
 *   useOnboardingInit      — initial data load + resume step resolution
 *   useOnboardingSettings  — step-2 form state + debounced auto-save
 *   useOnboardingBilling   — step-3 plan selection + activation
 *
 * The public return shape is unchanged — no call-site changes needed.
 */

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

export function useEmbeddedOnboarding({
  isEmbedded,
  isModeLoading,
  locale,
  hostParam,
  router,
  messages,
  onBillingConfirmation,
}: UseEmbeddedOnboardingParams) {
  // Shared state: written by multiple sub-hooks, read by the page
  const [step, setStep] = useState<EmbeddedStep>(1)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Stable callback refs for setters passed into sub-hooks
  const stableSetStep = useCallback((s: EmbeddedStep) => setStep(s), [])
  const stableSetErrorBanner = useCallback(
    (msg: string | null) => setErrorBanner(msg),
    []
  )
  const billingStatusMessages = useMemo(
    () => ({
      billingStatusPending: messages.billingStatusPending,
      billingStatusDeclined: messages.billingStatusDeclined,
      billingStatusFrozen: messages.billingStatusFrozen,
      billingStatusExpired: messages.billingStatusExpired,
      billingStatusCanceled: messages.billingStatusCanceled,
      billingStatusError: messages.billingStatusError,
      billingStatusNeedsAttention: messages.billingStatusNeedsAttention,
    }),
    [
      messages.billingStatusPending,
      messages.billingStatusDeclined,
      messages.billingStatusFrozen,
      messages.billingStatusExpired,
      messages.billingStatusCanceled,
      messages.billingStatusError,
      messages.billingStatusNeedsAttention,
    ]
  )

  // ── Sub-hook: initial data load ──────────────────────────────────────────
  const init = useOnboardingInit({
    isEmbedded,
    isModeLoading,
    locale,
    router,
    prefillWarningMessage: messages.prefillWarning,
    billingStatusMessages,
    setStep: stableSetStep,
    setErrorBanner: stableSetErrorBanner,
  })

  // ── Sub-hook: step-2 settings form + auto-save ───────────────────────────
  const settings = useOnboardingSettings({
    step,
    setStep: stableSetStep,
    setErrorBanner: stableSetErrorBanner,
    storeNameRequiredMessage: messages.storeNameRequired,
    settingsSaveErrorMessage: messages.settingsSaveError,
    hasCompletedInitRef: init.hasCompletedInitRef,
    initialStoreName: init.initialStoreName,
    initialDefaultLanguage: init.initialDefaultLanguage,
    initialIsAutoVerifyEnabled: init.initialIsAutoVerifyEnabled,
  })

  // ── Sub-hook: step-3 billing ─────────────────────────────────────────────
  const billing = useOnboardingBilling({
    hostParam,
    billingActivationErrorMessage: messages.billingActivationError,
    setErrorBanner: stableSetErrorBanner,
    onBillingConfirmation,
  })

  return {
    // Loader gate
    isInitialLoading: init.isInitialLoading,
    // Step navigation
    step,
    setStep,
    // Alerts
    errorBanner,
    prefillWarning: init.prefillWarning,
    // Setup settings
    storeName: settings.storeName,
    storeNameError: settings.storeNameError,
    defaultLanguage: settings.defaultLanguage,
    setDefaultLanguage: settings.setDefaultLanguage,
    isAutoVerifyEnabled: settings.isAutoVerifyEnabled,
    setIsAutoVerifyEnabled: settings.setIsAutoVerifyEnabled,
    isSavingSettings: settings.isSavingSettings,
    handleStoreNameChange: settings.handleStoreNameChange,
    handleContinueToBilling: settings.handleContinueToBilling,
    // Billing
    billingPlanConfigsById: init.billingPlanConfigsById,
    isFreePlanClaimed: init.isFreePlanClaimed,
    selectedPlanId: billing.selectedPlanId,
    setSelectedPlanId: billing.setSelectedPlanId,
    isActivatingPlan: billing.isActivatingPlan,
    isBillingRedirecting: billing.isBillingRedirecting,
    handleActivatePlan: billing.handleActivatePlan,
    handleRetryBilling: billing.handleRetryBilling,
  }
}
