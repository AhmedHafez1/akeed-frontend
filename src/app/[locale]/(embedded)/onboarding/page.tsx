'use client'

import { type ReactNode, useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Redirect } from '@shopify/app-bridge/actions'
import { BlockStack, Card, Layout, Page } from '@shopify/polaris'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { useEmbeddedOnboarding } from '@/hooks/useEmbeddedOnboarding'
import { getLocaleFromPathname } from '@/lib/locale'
import type { OnboardingBillingPlan } from '@/types/embedded-onboarding.model'
import { OnboardingAlerts } from './components/OnboardingAlerts'
import { OnboardingStepCounter } from './components/OnboardingStepCounter'
import {
  BILLING_PLAN_DEFINITIONS,
  type EmbeddedStep,
  LANGUAGE_OPTION_DEFINITIONS,
  TOTAL_STEPS,
} from './onboarding.config'
import { BillingStep } from './steps/BillingStep'
import { ConfigurationStep } from './steps/ConfigurationStep'
import { WelcomeStep } from './steps/WelcomeStep'

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const { isEmbedded, isLoading: isModeLoading, appBridge, hostParam } =
    useAkeedMode()

  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

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
        return t('planPriceFree')
      }

      const formattedAmount = new Intl.NumberFormat(numberLocale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount)

      return t('planPricePerMonth', { price: formattedAmount })
    },
    [numberLocale, t]
  )

  const formatPlanVolumeLabel = useCallback(
    (includedVerifications: number) =>
      t('planVolumePerMonth', { count: includedVerifications }),
    [t]
  )

  const messages = useMemo(
    () => ({
      prefillWarning: t('prefillWarning'),
      storeNameRequired: t('storeNameRequired'),
      settingsSaveError: t('settingsSaveError'),
      billingActivationError: t('billingActivationError'),
      billingStatusPending: t('billingStatusPending'),
      billingStatusDeclined: t('billingStatusDeclined'),
      billingStatusFrozen: t('billingStatusFrozen'),
      billingStatusExpired: t('billingStatusExpired'),
      billingStatusCanceled: t('billingStatusCanceled'),
      billingStatusError: t('billingStatusError'),
      billingStatusNeedsAttention: t('billingStatusNeedsAttention'),
    }),
    [t]
  )

  const handleBillingConfirmation = useCallback(
    (confirmationUrl: string) => {
      if (appBridge) {
        const redirect = Redirect.create(appBridge)
        redirect.dispatch(Redirect.Action.REMOTE, confirmationUrl)
        return
      }

      window.location.href = confirmationUrl
    },
    [appBridge]
  )

  const {
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
          name: t(planDefinition.nameKey),
          monthlyPriceLabel: runtimePlan
            ? formatPlanPriceLabel(runtimePlan.amount, runtimePlan.currencyCode)
            : t(planDefinition.priceKey),
          monthlyVolumeLabel: runtimePlan
            ? formatPlanVolumeLabel(runtimePlan.includedVerifications)
            : t(planDefinition.volumeKey),
          features: planDefinition.featureKeys.map((key) => t(key)),
          badge: planDefinition.badgeKey
            ? t(planDefinition.badgeKey)
            : undefined,
        }
      }),
    [
      billingPlanConfigsById,
      formatPlanPriceLabel,
      formatPlanVolumeLabel,
      t,
    ]
  )

  const stepComponents: Record<EmbeddedStep, ReactNode> = {
    1: (
      <WelcomeStep
        heading={t('welcomeHeading')}
        body={t('welcomeBody')}
        ctaLabel={t('startSetup')}
        onStart={() => setStep(2)}
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
        heading={t('billingHeading')}
        body={t('billingBody')}
        ctaLabel={t('activatePlan')}
        selectedBadgeLabel={t('selectedPlan')}
        plans={billingPlans}
        selectedPlanId={selectedPlanId}
        isActivating={isActivatingPlan}
        onPlanSelect={setSelectedPlanId}
        onActivate={handleActivatePlan}
      />
    ),
  }

  if (isModeLoading || isInitialLoading) {
    return <FullPageLoader />
  }

  if (!isEmbedded) {
    return <OnboardingContainer />
  }

  return (
    <Page title={t('title')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <OnboardingAlerts
              errorMessage={errorBanner}
              warningMessage={prefillWarning}
            />

            <Card>
              <BlockStack gap="200">
                <OnboardingStepCounter
                  label={t('stepCounter', { current: step, total: TOTAL_STEPS })}
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
