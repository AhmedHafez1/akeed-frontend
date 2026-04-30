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
  APP_LANGUAGE_OPTION_DEFINITIONS,
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
import {
  getLocaleFromPathname,
  isSupportedLocale,
  persistLocalePreference,
} from '@/shared/lib/locale'

const EMBEDDED_PLAN_FEATURE_KEYS = {
  starter: [
    'planStarterFeature1',
    'planStarterFeature2',
    'planStarterFeature3',
    'planStarterFeature4',
  ],
  basic: [
    'planBasicFeature1',
    'planBasicFeature2',
    'planBasicFeature3',
    'planBasicFeature4',
    'planBasicFeature5',
    'planBasicFeature6',
  ],
  pro: [
    'planProFeature1',
    'planProFeature2',
    'planProFeature3',
    'planProFeature4',
    'planProFeature5',
    'planProFeature6',
  ],
  business: [
    'planBusinessFeature1',
    'planBusinessFeature2',
    'planBusinessFeature3',
    'planBusinessFeature4',
  ],
} as const

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const tEmbedded = useTranslations('embeddedOnboarding')
  const tPricing = useTranslations('pricing')
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

  const appLanguageOptions = useMemo(
    () =>
      APP_LANGUAGE_OPTION_DEFINITIONS.map(({ labelKey, value }) => ({
        label: t(labelKey),
        value,
      })),
    [t]
  )

  const handleAppLanguageChange = useCallback(
    (nextLocale: string) => {
      if (!isSupportedLocale(nextLocale) || nextLocale === locale) return

      persistLocalePreference(nextLocale)

      const newPathname = pathname.replace(`/${locale}`, `/${nextLocale}`)
      const search = typeof window !== 'undefined' ? window.location.search : ''
      router.replace(`${newPathname}${search}`)
    },
    [locale, pathname, router]
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
    setStep,
    setDefaultLanguage,
    selectedPlanId,
    setSelectedPlanId,
    billingPlanConfigsById,
    isFreePlanClaimed,
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

  const stepCounterLabel = t('stepCounter', {
    current: step,
    total: TOTAL_STEPS,
  })

  const handleBackToConfiguration = useCallback(() => {
    setStep(2)
  }, [setStep])

  const billingPlans = useMemo<OnboardingBillingPlan[]>(
    () =>
      BILLING_PLAN_DEFINITIONS.map((planDefinition) => {
        const runtimePlan = billingPlanConfigsById[planDefinition.id]
        const planId = planDefinition.id

        return {
          id: planId,
          name: tEmbedded(planDefinition.nameKey),
          monthlyPriceLabel: runtimePlan
            ? formatPlanPriceLabel(runtimePlan.amount, runtimePlan.currencyCode)
            : tEmbedded(planDefinition.priceKey),
          monthlyVolumeLabel:
            planId === 'starter'
              ? tEmbedded(planDefinition.volumeKey)
              : runtimePlan
                ? formatPlanVolumeLabel(runtimePlan.includedVerifications)
                : tEmbedded(planDefinition.volumeKey),
          subtitle: tPricing(`${planId}_subtitle`),
          features: EMBEDDED_PLAN_FEATURE_KEYS[planId].map((featureKey) =>
            tEmbedded(featureKey)
          ),
          ctaLabel: tPricing(`${planId}_cta`),
        }
      }),
    [
      billingPlanConfigsById,
      formatPlanPriceLabel,
      formatPlanVolumeLabel,
      tEmbedded,
      tPricing,
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
        appLanguageLabel={t('appLanguageLabel')}
        appLanguageOptions={appLanguageOptions}
        appLanguage={locale}
        defaultLanguageLabel={t('defaultLanguageLabel')}
        languageOptions={languageOptions}
        defaultLanguage={defaultLanguage}
        autoVerifyLabel={t('autoVerifyLabel')}
        autoVerifyDescription={t('autoVerifyDescription')}
        continueLabel={t('continueToBilling')}
        isAutoVerifyEnabled={isAutoVerifyEnabled}
        isSaving={isSavingSettings}
        onStoreNameChange={handleStoreNameChange}
        onAppLanguageChange={handleAppLanguageChange}
        onLanguageChange={setDefaultLanguage}
        onAutoVerifyChange={setIsAutoVerifyEnabled}
        onContinue={handleContinueToBilling}
      />
    ),
    3: (
      <BillingStep
        heading={tEmbedded('billingHeading')}
        body={tEmbedded('billingBody')}
        changeLaterNote={tEmbedded('changePlanLaterNote')}
        plans={billingPlans}
        selectedPlanId={selectedPlanId}
        isActivating={isActivatingPlan}
        disabledPlanIds={isFreePlanClaimed ? ['starter'] : []}
        disabledPlanTooltips={
          isFreePlanClaimed
            ? { starter: tEmbedded('freePlanAlreadyClaimedTooltip') }
            : undefined
        }
        recommendedBadgeLabel={t('recommendedBadge')}
        errorMessage={step === 3 ? errorBanner : null}
        retryLabel={tEmbedded('billingTryAgain')}
        manageSettingsLabel={tEmbedded('billingManageSettings')}
        freePlanUsedLabel={tEmbedded('freePlanUsedBadge')}
        backLabel={tEmbedded('billingBack')}
        canManageBilling={billingManagementUrl !== null}
        onPlanSelect={setSelectedPlanId}
        onActivate={handleActivatePlan}
        onBack={handleBackToConfiguration}
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
    <Page title={step === 3 ? undefined : t('title')} fullWidth={step === 3}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <OnboardingAlerts
              errorMessage={step === 3 ? null : errorBanner}
              warningMessage={prefillWarning}
            />

            {step === 3 ? (
              <div className="mx-auto w-full max-w-280">
                <Card padding={{ xs: '400', md: '800' }}>
                  <BlockStack gap="200">
                    <OnboardingStepCounter label={stepCounterLabel} />
                    {stepComponents[step]}
                  </BlockStack>
                </Card>
              </div>
            ) : (
              <Card>
                <BlockStack gap="200">
                  <OnboardingStepCounter label={stepCounterLabel} />
                  {stepComponents[step]}
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
