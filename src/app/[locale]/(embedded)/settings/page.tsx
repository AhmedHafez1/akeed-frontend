'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Redirect } from '@shopify/app-bridge/actions'
import {
  Banner,
  BlockStack,
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
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/lib/locale'
import {
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
  updateOnboardingSettings,
} from '@/lib/onboarding'
import type {
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/types/embedded-onboarding.model'

type BillingStatusKey =
  | 'billingStatusActive'
  | 'billingStatusPending'
  | 'billingStatusDeclined'
  | 'billingStatusFrozen'
  | 'billingStatusExpired'
  | 'billingStatusCanceled'
  | 'billingStatusError'
  | 'billingStatusUnknown'

function normalizeBillingStatus(status: string | null): string | null {
  if (!status) {
    return null
  }

  const normalized = status.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function resolveBillingStatusKey(status: string | null): BillingStatusKey {
  if (!status || status === 'not_required') {
    return 'billingStatusUnknown'
  }

  if (status === 'active') {
    return 'billingStatusActive'
  }

  if (status === 'pending') {
    return 'billingStatusPending'
  }

  if (status === 'declined') {
    return 'billingStatusDeclined'
  }

  if (status === 'frozen') {
    return 'billingStatusFrozen'
  }

  if (status === 'expired') {
    return 'billingStatusExpired'
  }

  if (status === 'cancelled' || status === 'canceled') {
    return 'billingStatusCanceled'
  }

  if (status === 'error') {
    return 'billingStatusError'
  }

  return 'billingStatusUnknown'
}

function formatPlanId(planId: OnboardingBillingPlanId): string {
  return planId.charAt(0).toUpperCase() + planId.slice(1)
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { isEmbedded, isLoading: isModeLoading, appBridge } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeNameError, setStoreNameError] = useState<string | undefined>(
    undefined
  )
  const [defaultLanguage, setDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>('auto')
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(true)
  const [billingPlanId, setBillingPlanId] = useState<OnboardingBillingPlanId | null>(
    null
  )
  const [billingStatus, setBillingStatus] = useState<string | null>(null)
  const [billingManagementUrl, setBillingManagementUrl] = useState<string | null>(
    null
  )
  const [billingPlansById, setBillingPlansById] = useState<
    Partial<Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>>
  >({})
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  const languageOptions = useMemo(
    () => [
      { label: t('languageAuto'), value: 'auto' },
      { label: t('languageEnglish'), value: 'en' },
      { label: t('languageArabic'), value: 'ar' },
    ],
    [t]
  )

  useEffect(() => {
    if (isModeLoading) {
      return
    }

    let active = true
    const search = typeof window !== 'undefined' ? window.location.search : ''

    const loadSettings = async () => {
      setIsInitialLoading(true)
      setErrorBanner(null)

      try {
        const [stateResponse, plansResponse] = await Promise.all([
          fetchOnboardingState(),
          fetchOnboardingBillingPlans().catch((error) => {
            console.error('[Settings] Failed to load billing plans:', error)
            return null
          }),
        ])

        if (!active) {
          return
        }

        const { state } = stateResponse
        if (state.onboardingStatus === 'pending') {
          router.replace(`/${locale}/onboarding${search}`)
          return
        }

        setStoreName(state.storeName ?? '')
        setDefaultLanguage(state.defaultLanguage)
        setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
        setBillingPlanId(state.billingPlanId)
        setBillingStatus(state.billingStatus)
        setBillingManagementUrl(state.billingManagementUrl)

        if (plansResponse) {
          const plansMap: Partial<
            Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>
          > = {}
          for (const plan of plansResponse.plans) {
            plansMap[plan.id] = plan
          }
          setBillingPlansById(plansMap)
        }
      } catch (error) {
        console.error('[Settings] Failed to load onboarding settings:', error)
        if (active) {
          setErrorBanner(t('loadError'))
        }
      } finally {
        if (active) {
          setIsInitialLoading(false)
        }
      }
    }

    void loadSettings()

    return () => {
      active = false
    }
  }, [isModeLoading, locale, router, t])

  const activePlanName = useMemo(() => {
    if (!billingPlanId) {
      return null
    }

    return billingPlansById[billingPlanId]?.name ?? formatPlanId(billingPlanId)
  }, [billingPlanId, billingPlansById])

  const billingStatusLabel = useMemo(() => {
    const normalized = normalizeBillingStatus(billingStatus)
    const key = resolveBillingStatusKey(normalized)
    return t(key)
  }, [billingStatus, t])

  const handleSave = useCallback(async () => {
    setErrorBanner(null)
    setSuccessBanner(null)

    const trimmedStoreName = storeName.trim()
    if (!trimmedStoreName) {
      setStoreNameError(t('storeNameRequired'))
      return
    }

    setStoreNameError(undefined)
    setIsSaving(true)

    try {
      const { state } = await updateOnboardingSettings({
        storeName: trimmedStoreName,
        defaultLanguage,
        isAutoVerifyEnabled,
      })

      setStoreName(state.storeName ?? trimmedStoreName)
      setDefaultLanguage(state.defaultLanguage)
      setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
      setBillingPlanId(state.billingPlanId)
      setBillingStatus(state.billingStatus)
      setBillingManagementUrl(state.billingManagementUrl)
      setSuccessBanner(t('saveSuccess'))
    } catch (error) {
      console.error('[Settings] Failed to save onboarding settings:', error)
      setErrorBanner(t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [defaultLanguage, isAutoVerifyEnabled, storeName, t])

  const handleManageBilling = useCallback(() => {
    if (!billingManagementUrl) {
      setErrorBanner(t('billingManagementUnavailable'))
      return
    }

    if (isEmbedded && appBridge) {
      const redirect = Redirect.create(appBridge)
      redirect.dispatch(Redirect.Action.REMOTE, billingManagementUrl)
      return
    }

    window.location.href = billingManagementUrl
  }, [appBridge, billingManagementUrl, isEmbedded, t])

  if (isModeLoading || isInitialLoading) {
    return <FullPageLoader />
  }

  return (
    <Page title={t('title')} subtitle={t('subtitle')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {errorBanner && (
              <Banner tone="critical">
                <p>{errorBanner}</p>
              </Banner>
            )}

            {successBanner && (
              <Banner tone="success">
                <p>{successBanner}</p>
              </Banner>
            )}

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('storeConfigurationHeading')}
                </Text>

                <TextField
                  label={t('storeNameLabel')}
                  value={storeName}
                  onChange={(value) => {
                    setStoreName(value)
                    if (storeNameError) {
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

                <Checkbox
                  label={t('autoVerifyLabel')}
                  helpText={t('autoVerifyDescription')}
                  checked={isAutoVerifyEnabled}
                  onChange={setIsAutoVerifyEnabled}
                />

                <Button variant="primary" loading={isSaving} onClick={handleSave}>
                  {t('saveButton')}
                </Button>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  {t('subscriptionHeading')}
                </Text>

                <Text as="p" variant="bodyMd">
                  {activePlanName
                    ? t('subscriptionCurrentPlan', { plan: activePlanName })
                    : t('subscriptionNoPlan')}
                </Text>

                <Text as="p" tone="subdued" variant="bodySm">
                  {t('subscriptionStatusLabel', { status: billingStatusLabel })}
                </Text>

                <Button onClick={handleManageBilling}>
                  {t('manageBillingButton')}
                </Button>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
