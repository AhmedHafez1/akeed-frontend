'use client'

import { type ReactNode, useCallback, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BlockStack, Card, Layout, Page } from '@shopify/polaris'
import { OnboardingPageSkeleton } from '@/shared/layout/skeletons'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import {
  BILLING_PLAN_DEFINITIONS,
  LANGUAGE_OPTION_DEFINITIONS,
  OnboardingAlerts,
  OnboardingStepCounter,
  BillingStep,
  ConfigurationStep,
  TOTAL_STEPS,
  useEmbeddedOnboarding,
  WelcomeStep,
  type EmbeddedStep,
  type OnboardingBillingPlan,
} from '@/features/onboarding'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/shared/lib/locale'

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const tEmbedded = useTranslations('embeddedOnboarding')
  const { isEmbedded, isLoading: isModeLoading, hostParam } = useAkeedMode()

  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  useEffect(() => {
    if (isModeLoading) {
      return
    }

    if (!isEmbedded) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [isEmbedded, isModeLoading, locale, router])

  const languageOptions = useMemo(
    () =>
      LANGUAGE_OPTION_DEFINITIONS.map(({ labelKey, value }) => ({
        label: t(labelKey),
        value,
      })),
    [t]
  )

  const numberLocale = useMemo(() => {
    return locale === 'ar' ? 'ar' : 'en-US'
  }, [locale])

  const formatPlanPriceLabel = useCallback(
    (amount: number, currencyCode: string) => {
      if (amount === 0) {
        return tEmbedded('planPriceFree')
      }

      const formattedAmount = new Intl.NumberFormat(numberLocale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount)

      return tEmbedded('planPricePerMonth', { price: formattedAmount })
    },
    [numberLocale, tEmbedded]
  )

  const formatPlanVolumeLabel = useCallback(
    (includedVerifications: number) =>
      tEmbedded('planVolumePerMonth', { count: includedVerifications }),
    [tEmbedded]
  )

  const messages = useMemo(
    () => ({
      prefillWarning: tEmbedded('prefillWarning'),
      storeNameRequired: tEmbedded('storeNameRequired'),
      settingsSaveError: tEmbedded('settingsSaveError'),
      billingActivationError: tEmbedded('billingActivationError'),
      billingStatusPending: tEmbedded('billingStatusPending'),
      billingStatusDeclined: tEmbedded('billingStatusDeclined'),
      billingStatusFrozen: tEmbedded('billingStatusFrozen'),
      billingStatusExpired: tEmbedded('billingStatusExpired'),
      billingStatusCanceled: tEmbedded('billingStatusCanceled'),
      billingStatusError: tEmbedded('billingStatusError'),
      billingStatusNeedsAttention: tEmbedded('billingStatusNeedsAttention'),
    }),
    [tEmbedded]
  )

  const handleBillingConfirmation = useCallback((confirmationUrl: string) => {
    // In App Bridge v4, use open() with _top to navigate out of
    // the embedded iframe for external redirects (e.g. Shopify billing).
    if (window.top && window.top !== window.self) {
      window.open(confirmationUrl, '_top')
    } else {
      window.location.href = confirmationUrl
    }
  }, [])

  const {
    isInitialLoading,
    step,
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
  } = useEmbeddedOnboarding({
    isEmbedded,
    isModeLoading,
    locale,
    hostParam,
    router,
    messages,
    onBillingConfirmation: handleBillingConfirmation,
  })

  const billingPlans = useMemo<OnboardingBillingPlan[]>(
    () =>
      BILLING_PLAN_DEFINITIONS.map((planDefinition) => {
        const runtimePlan = billingPlanConfigsById[planDefinition.id]

        return {
          id: planDefinition.id,
          name: tEmbedded(planDefinition.nameKey),
          monthlyPriceLabel: runtimePlan
            ? formatPlanPriceLabel(runtimePlan.amount, runtimePlan.currencyCode)
            : tEmbedded(planDefinition.priceKey),
          monthlyVolumeLabel:
            planDefinition.id === 'starter'
              ? tEmbedded(planDefinition.volumeKey)
              : runtimePlan
                ? formatPlanVolumeLabel(runtimePlan.includedVerifications)
                : tEmbedded(planDefinition.volumeKey),
        }
      }),
    [
      billingPlanConfigsById,
      formatPlanPriceLabel,
      formatPlanVolumeLabel,
      tEmbedded,
    ]
  )

  const stepComponents: Record<EmbeddedStep, ReactNode> = {
    1: (
      <WelcomeStep
        heading={t('welcomeHeading')}
        body={t('welcomeBody')}
        ctaLabel={t('startSetup')}
        onStart={handleStartSetup}
      />
    ),
    2: (
      <ConfigurationStep
        heading={t('configurationHeading')}
        storeNameLabel={t('storeNameLabel')}
        storeName={storeName}
        storeNameError={storeNameError}
        defaultLanguageLabel={t('defaultLanguageLabel')}
        languageOptions={languageOptions}
        defaultLanguage={defaultLanguage}
        autoVerifyLabel={t('autoVerifyLabel')}
        autoVerifyDescription={t('autoVerifyDescription')}
        continueLabel={t('continueToBilling')}
        isAutoVerifyEnabled={isAutoVerifyEnabled}
        isSaving={isSavingSettings}
        onStoreNameChange={handleStoreNameChange}
        onLanguageChange={setDefaultLanguage}
        onAutoVerifyChange={setIsAutoVerifyEnabled}
        onContinue={handleContinueToBilling}
      />
    ),
    3: (
      <BillingStep
        heading={tEmbedded('billingHeading')}
        body={tEmbedded('billingBody')}
        ctaLabel={tEmbedded('activatePlan')}
        plans={billingPlans}
        selectedPlanId={selectedPlanId}
        isActivating={isActivatingPlan}
        errorMessage={step === 3 ? errorBanner : null}
        retryLabel={tEmbedded('billingTryAgain')}
        manageSettingsLabel={tEmbedded('billingManageSettings')}
        canManageBilling={billingManagementUrl !== null}
        onPlanSelect={setSelectedPlanId}
        onActivate={handleActivatePlan}
        onRetry={handleRetryBilling}
        onManageBilling={handleManageBilling}
      />
    ),
  }

  const isPageLoading = !isEmbedded || isModeLoading || isInitialLoading
  useAppBridgeLoading(isPageLoading || isBillingRedirecting)

  if (isPageLoading || isBillingRedirecting) {
    return <OnboardingPageSkeleton />
  }

  return (
    <Page title={t('title')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <OnboardingAlerts
              errorMessage={step === 3 ? null : errorBanner}
              warningMessage={prefillWarning}
            />

            <Card>
              <BlockStack gap="200">
                <OnboardingStepCounter
                  label={t('stepCounter', {
                    current: step,
                    total: TOTAL_STEPS,
                  })}
                />
                {stepComponents[step]}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
