'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { SettingsPageSkeleton } from '@/shared/layout/skeletons'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import {
  createOnboardingBilling,
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
  type IntegrationOnboardingLanguage,
  type OnboardingBillingPlanConfig,
  type OnboardingBillingPlanId,
  updateOnboardingSettings,
} from '@/features/onboarding'
import { PlanComparison } from './components/PlanComparison'
import { UsageOverview } from './components/UsageOverview'

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

const SHIPPING_CURRENCY_OPTIONS = [
  'USD',
  'EUR',
  'EGP',
  'SAR',
  'AED',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'JOD',
  'MAD',
] as const

const SUBSCRIPTION_SECTION_ID = 'subscription-usage'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const {
    isEmbedded,
    isLoading: isModeLoading,
    hostParam,
    shopify,
  } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const { stats } = useDashboardStats('last_30_days')

  useEffect(() => {
    if (isModeLoading) {
      return
    }

    if (!isEmbedded) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [isEmbedded, isModeLoading, locale, router])

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeNameError, setStoreNameError] = useState<string | undefined>(
    undefined
  )
  const [shippingCurrency, setShippingCurrency] = useState('USD')
  const [avgShippingCost, setAvgShippingCost] = useState('3')
  const [avgShippingCostError, setAvgShippingCostError] = useState<
    string | undefined
  >(undefined)
  const [defaultLanguage, setDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>('auto')
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(true)
  const [billingPlanId, setBillingPlanId] =
    useState<OnboardingBillingPlanId | null>(null)
  const [billingStatus, setBillingStatus] = useState<string | null>(null)
  const [billingManagementUrl, setBillingManagementUrl] = useState<
    string | null
  >(null)
  const [billingPlansById, setBillingPlansById] = useState<
    Partial<Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>>
  >({})
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] =
    useState<OnboardingBillingPlanId | null>(null)
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [isFreePlanClaimed, setIsFreePlanClaimed] = useState(false)

  const languageOptions = useMemo(
    () => [
      { label: t('languageAuto'), value: 'auto' },
      { label: t('languageEnglish'), value: 'en' },
      { label: t('languageArabic'), value: 'ar' },
    ],
    [t]
  )

  const shippingCurrencyOptions = useMemo(
    () =>
      SHIPPING_CURRENCY_OPTIONS.map((currency) => ({
        label: t(`shippingCurrencyOption${currency}`),
        value: currency,
      })),
    [t]
  )

  useEffect(() => {
    if (isModeLoading) {
      return
    }

    if (!isEmbedded) {
      setIsInitialLoading(false)
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
        setShippingCurrency(state.shippingCurrency ?? 'USD')
        setAvgShippingCost(String(state.avgShippingCost ?? 3))
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
          setIsFreePlanClaimed(plansResponse.isFreePlanClaimed)
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
  }, [isEmbedded, isModeLoading, locale, router, t])

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

  const planOptions = useMemo(() => {
    const planIds: OnboardingBillingPlanId[] = [
      'starter',
      'growth',
      'pro',
      'scale',
    ]
    return planIds.map((id) => {
      const config = billingPlansById[id]
      return {
        id,
        name: config?.name ?? formatPlanId(id),
        priceLabel: config
          ? config.amount === 0
            ? t('planFree')
            : t('planPricePerMonth', {
                price: new Intl.NumberFormat(locale, {
                  style: 'currency',
                  currency: config.currencyCode,
                  minimumFractionDigits: Number.isInteger(config.amount)
                    ? 0
                    : 2,
                  maximumFractionDigits: 2,
                }).format(config.amount),
              })
          : formatPlanId(id),
        volumeLabel: config
          ? t('planVolumePerMonth', { count: config.includedVerifications })
          : '',
      }
    })
  }, [billingPlansById, locale, t])

  const usageData = useMemo(() => {
    if (!stats) return null

    const { used, limit } = stats.usage
    const safeLimit = Math.max(limit, 1)
    const percent = Math.min(100, Math.round((used / safeLimit) * 100))

    return {
      used,
      limit,
      usedLabel: t('usageUsedPercent', { value: percent }),
      limitLabel: t('usageMonthlyLimit'),
      upgradePrompt: percent >= 80 ? t('usageUpgradePrompt') : null,
    }
  }, [stats, t])

  useEffect(() => {
    setSelectedPlanId(billingPlanId)
  }, [billingPlanId])

  const handleChangePlan = useCallback(async () => {
    if (!selectedPlanId || selectedPlanId === billingPlanId) return

    setErrorBanner(null)
    setSuccessBanner(null)
    setIsChangingPlan(true)

    try {
      const { confirmationUrl } = await createOnboardingBilling(
        selectedPlanId,
        hostParam ?? undefined
      )

      if (isEmbedded && window.top && window.top !== window.self) {
        window.open(confirmationUrl, '_top')
      } else {
        window.location.href = confirmationUrl
      }
    } catch (error) {
      console.error('[Settings] Failed to change plan:', error)
      setErrorBanner(t('changePlanError'))
    } finally {
      setIsChangingPlan(false)
    }
  }, [billingPlanId, hostParam, isEmbedded, selectedPlanId, t])

  const handleSave = useCallback(async () => {
    setErrorBanner(null)
    setSuccessBanner(null)

    const trimmedStoreName = storeName.trim()
    if (!trimmedStoreName) {
      setStoreNameError(t('storeNameRequired'))
      return
    }
    const parsedAvgShippingCost = Number.parseFloat(avgShippingCost)
    if (!Number.isFinite(parsedAvgShippingCost) || parsedAvgShippingCost < 0) {
      setAvgShippingCostError(t('avgShippingCostInvalid'))
      return
    }

    setStoreNameError(undefined)
    setAvgShippingCostError(undefined)
    setIsSaving(true)

    // Optimistic: show success immediately so the app feels instant
    setSuccessBanner(t('saveSuccess'))
    shopify?.toast.show(t('saveSuccess'))

    // Snapshot current values to revert on failure
    const prevStoreName = storeName
    const prevShippingCurrency = shippingCurrency
    const prevAvgShippingCost = avgShippingCost
    const prevDefaultLanguage = defaultLanguage
    const prevIsAutoVerifyEnabled = isAutoVerifyEnabled

    try {
      const { state } = await updateOnboardingSettings({
        storeName: trimmedStoreName,
        defaultLanguage,
        isAutoVerifyEnabled,
        shippingCurrency,
        avgShippingCost: Number(parsedAvgShippingCost.toFixed(2)),
      })

      // Reconcile with server state
      setStoreName(state.storeName ?? trimmedStoreName)
      setShippingCurrency(state.shippingCurrency ?? shippingCurrency)
      setAvgShippingCost(String(state.avgShippingCost ?? parsedAvgShippingCost))
      setDefaultLanguage(state.defaultLanguage)
      setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
      setBillingPlanId(state.billingPlanId)
      setBillingStatus(state.billingStatus)
      setBillingManagementUrl(state.billingManagementUrl)
    } catch (error) {
      console.error('[Settings] Failed to save onboarding settings:', error)
      // Revert optimistic update
      setSuccessBanner(null)
      setErrorBanner(t('saveError'))
      setStoreName(prevStoreName)
      setShippingCurrency(prevShippingCurrency)
      setAvgShippingCost(prevAvgShippingCost)
      setDefaultLanguage(prevDefaultLanguage)
      setIsAutoVerifyEnabled(prevIsAutoVerifyEnabled)
    } finally {
      setIsSaving(false)
    }
  }, [
    avgShippingCost,
    defaultLanguage,
    isAutoVerifyEnabled,
    shippingCurrency,
    storeName,
    t,
  ])

  const handleManageBilling = useCallback(() => {
    if (!billingManagementUrl) {
      setErrorBanner(t('billingManagementUnavailable'))
      return
    }

    // In App Bridge v4, use open() with _top to navigate out of the
    // embedded iframe for external redirects (e.g. Shopify billing page).
    if (isEmbedded && window.top && window.top !== window.self) {
      window.open(billingManagementUrl, '_top')
      return
    }

    window.location.href = billingManagementUrl
  }, [billingManagementUrl, isEmbedded, t])

  const isPageLoading = !isEmbedded || isModeLoading || isInitialLoading
  useAppBridgeLoading(isPageLoading)

  if (isPageLoading) {
    return <SettingsPageSkeleton />
  }

  return (
    <Page>
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

                <Select
                  label={t('shippingCurrencyLabel')}
                  options={shippingCurrencyOptions}
                  value={shippingCurrency}
                  onChange={setShippingCurrency}
                />

                <TextField
                  label={t('avgShippingCostLabel')}
                  type="number"
                  autoComplete="off"
                  min={0}
                  step={0.01}
                  value={avgShippingCost}
                  onChange={(value) => {
                    setAvgShippingCost(value)
                    if (avgShippingCostError) {
                      setAvgShippingCostError(undefined)
                    }
                  }}
                  error={avgShippingCostError}
                  helpText={t('avgShippingCostHelp')}
                />

                <Checkbox
                  label={t('autoVerifyLabel')}
                  helpText={t('autoVerifyDescription')}
                  checked={isAutoVerifyEnabled}
                  onChange={setIsAutoVerifyEnabled}
                />

                <Button
                  variant="primary"
                  loading={isSaving}
                  onClick={handleSave}
                >
                  {t('saveButton')}
                </Button>
              </BlockStack>
            </Card>

            <div id={SUBSCRIPTION_SECTION_ID}>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      {t('subscriptionHeading')}
                    </Text>

                    <Text as="p" variant="bodyMd">
                      {activePlanName
                        ? t('subscriptionCurrentPlan', { plan: activePlanName })
                        : t('subscriptionNoPlan')}
                    </Text>

                    <Text as="p" tone="subdued" variant="bodySm">
                      {t('subscriptionStatusLabel', {
                        status: billingStatusLabel,
                      })}
                    </Text>
                  </BlockStack>

                  {usageData && (
                    <UsageOverview
                      used={usageData.used}
                      limit={usageData.limit}
                      title={t('usageTitle')}
                      usedLabel={usageData.usedLabel}
                      limitLabel={usageData.limitLabel}
                      upgradePrompt={usageData.upgradePrompt}
                    />
                  )}

                  <PlanComparison
                    plans={planOptions}
                    currentPlanId={billingPlanId}
                    selectedPlanId={selectedPlanId}
                    isChangingPlan={isChangingPlan}
                    disabledPlanIds={isFreePlanClaimed ? ['starter'] : []}
                    disabledPlanTooltips={
                      isFreePlanClaimed
                        ? { starter: t('freePlanAlreadyClaimedTooltip') }
                        : undefined
                    }
                    currentBadgeLabel={t('currentPlanBadge')}
                    changePlanLabel={t('changePlanButton')}
                    onPlanSelect={setSelectedPlanId}
                    onChangePlan={handleChangePlan}
                  />

                  <Button onClick={handleManageBilling}>
                    {t('manageBillingButton')}
                  </Button>
                </BlockStack>
              </Card>
            </div>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
