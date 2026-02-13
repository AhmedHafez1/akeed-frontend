'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Redirect } from '@shopify/app-bridge/actions'
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Layout,
  Page,
  Select,
  Text,
  TextField,
} from '@shopify/polaris'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import {
  createOnboardingBilling,
  fetchOnboardingState,
  updateOnboardingSettings,
} from '@/lib/onboarding'
import { getLocaleFromPathname } from '@/lib/locale'
import type { IntegrationOnboardingLanguage } from '@/types/embedded-onboarding.model'

type EmbeddedStep = 1 | 2 | 3

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const { isEmbedded, isLoading: isModeLoading, appBridge, hostParam } =
    useAkeedMode()

  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [step, setStep] = useState<EmbeddedStep>(1)

  const [storeName, setStoreName] = useState('')
  const [storeNameError, setStoreNameError] = useState<string | undefined>()
  const [defaultLanguage, setDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>('auto')
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(true)

  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isActivatingPlan, setIsActivatingPlan] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [prefillWarning, setPrefillWarning] = useState<string | null>(null)

  const languageOptions = useMemo(
    () => [
      { label: t('languageAuto'), value: 'auto' },
      { label: t('languageEnglish'), value: 'en' },
      { label: t('languageArabic'), value: 'ar' },
    ],
    [t]
  )

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
        const { state } = await fetchOnboardingState()
        if (!active) return

        if (state.onboardingStatus === 'completed') {
          router.replace(`/${locale}/dashboard${window.location.search}`)
          return
        }

        setStoreName(state.storeName ?? '')
        setDefaultLanguage(state.defaultLanguage)
        setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
      } catch (error) {
        console.error('[Onboarding] Failed to load state:', error)

        if (active) {
          setPrefillWarning(t('prefillWarning'))
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
  }, [isEmbedded, isModeLoading, locale, router, t])

  const handleContinueToBilling = async () => {
    setErrorBanner(null)

    const trimmedStoreName = storeName.trim()

    if (!trimmedStoreName) {
      setStoreNameError(t('storeNameRequired'))
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
      setErrorBanner(t('settingsSaveError'))
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleActivatePlan = async () => {
    setErrorBanner(null)
    setIsActivatingPlan(true)

    try {
      const { confirmationUrl } = await createOnboardingBilling(
        hostParam ?? undefined
      )

      if (appBridge) {
        const redirect = Redirect.create(appBridge)
        redirect.dispatch(Redirect.Action.REMOTE, confirmationUrl)
        return
      }

      window.location.href = confirmationUrl
    } catch (error) {
      console.error('[Onboarding] Failed to activate billing:', error)
      setErrorBanner(t('billingActivationError'))
    } finally {
      setIsActivatingPlan(false)
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
            {errorBanner && (
              <Banner tone="critical">
                <p>{errorBanner}</p>
              </Banner>
            )}

            {prefillWarning && (
              <Banner tone="warning">
                <p>{prefillWarning}</p>
              </Banner>
            )}

            <Card>
              <BlockStack gap="200">
                <Text as="p" tone="subdued" variant="bodySm">
                  {t('stepCounter', { current: step, total: 3 })}
                </Text>

                {step === 1 && (
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">
                        {t('welcomeHeading')}
                      </Text>
                      <Text as="p" tone="subdued" variant="bodyMd">
                        {t('welcomeBody')}
                      </Text>
                    </BlockStack>

                    <Box>
                      <Button variant="primary" onClick={() => setStep(2)}>
                        {t('startSetup')}
                      </Button>
                    </Box>
                  </BlockStack>
                )}

                {step === 2 && (
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingLg">
                      {t('configurationHeading')}
                    </Text>

                    <TextField
                      label={t('storeNameLabel')}
                      value={storeName}
                      onChange={(value) => {
                        setStoreName(value)
                        if (value.trim().length > 0) {
                          setStoreNameError(undefined)
                        }
                      }}
                      autoComplete="organization"
                      error={storeNameError}
                    />

                    <Select
                      label={t('defaultLanguageLabel')}
                      options={languageOptions}
                      value={defaultLanguage}
                      onChange={(value) =>
                        setDefaultLanguage(value as IntegrationOnboardingLanguage)
                      }
                    />

                    <Card>
                      <BlockStack gap="200">
                        <Checkbox
                          label={t('autoVerifyLabel')}
                          checked={isAutoVerifyEnabled}
                          onChange={setIsAutoVerifyEnabled}
                        />
                        <Text as="p" tone="subdued" variant="bodySm">
                          {t('autoVerifyDescription')}
                        </Text>
                      </BlockStack>
                    </Card>

                    <Box>
                      <Button
                        variant="primary"
                        loading={isSavingSettings}
                        onClick={handleContinueToBilling}
                      >
                        {t('continueToBilling')}
                      </Button>
                    </Box>
                  </BlockStack>
                )}

                {step === 3 && (
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">
                        {t('billingHeading')}
                      </Text>
                      <Text as="p" tone="subdued" variant="bodyMd">
                        {t('billingBody')}
                      </Text>
                    </BlockStack>

                    <Box>
                      <Button
                        variant="primary"
                        loading={isActivatingPlan}
                        onClick={handleActivatePlan}
                      >
                        {t('activatePlan')}
                      </Button>
                    </Box>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
