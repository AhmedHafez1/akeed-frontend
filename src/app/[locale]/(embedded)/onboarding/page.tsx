'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Redirect } from '@shopify/app-bridge/actions'
import { BlockStack, Card, Layout, Page } from '@shopify/polaris'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { useEmbeddedOnboarding } from '@/hooks/useEmbeddedOnboarding'
import { getLocaleFromPathname } from '@/lib/locale'
import { OnboardingAlerts } from './components/OnboardingAlerts'
import { OnboardingStepCounter } from './components/OnboardingStepCounter'
import { BillingStep } from './steps/BillingStep'
import { ConfigurationStep } from './steps/ConfigurationStep'
import { WelcomeStep } from './steps/WelcomeStep'

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const { isEmbedded, isLoading: isModeLoading, appBridge, hostParam } =
    useAkeedMode()

  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  const languageOptions = useMemo(
    () => [
      { label: t('languageAuto'), value: 'auto' },
      { label: t('languageEnglish'), value: 'en' },
      { label: t('languageArabic'), value: 'ar' },
    ],
    [t]
  )

  const messages = useMemo(
    () => ({
      prefillWarning: t('prefillWarning'),
      storeNameRequired: t('storeNameRequired'),
      settingsSaveError: t('settingsSaveError'),
      billingActivationError: t('billingActivationError'),
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

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          <WelcomeStep
            heading={t('welcomeHeading')}
            body={t('welcomeBody')}
            ctaLabel={t('startSetup')}
            onStart={() => setStep(2)}
          />
        )
      case 2:
        return (
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
        )
      default:
        return (
          <BillingStep
            heading={t('billingHeading')}
            body={t('billingBody')}
            ctaLabel={t('activatePlan')}
            isActivating={isActivatingPlan}
            onActivate={handleActivatePlan}
          />
        )
    }
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
                {renderCurrentStep()}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
