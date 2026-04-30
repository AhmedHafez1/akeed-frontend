'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'
import {
  createOnboardingBilling,
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
  ONBOARDING_BILLING_PLAN_IDS,
  updateOnboardingSettings,
  type AutomationTimezone,
  type IntegrationOnboardingLanguage,
  type OnboardingBillingPlanConfig,
  type OnboardingBillingPlanId,
} from '@/features/onboarding'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import type {
  SettingsSelectOption,
  SettingsSkinProps,
} from './settings.types'

type BillingStatusKey =
  | 'billingStatusActive'
  | 'billingStatusPending'
  | 'billingStatusDeclined'
  | 'billingStatusFrozen'
  | 'billingStatusExpired'
  | 'billingStatusCanceled'
  | 'billingStatusError'
  | 'billingStatusUnknown'

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

const AUTOMATION_TIMEZONE_OPTIONS: readonly AutomationTimezone[] = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Qatar',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Muscat',
  'Asia/Amman',
  'Africa/Cairo',
  'Africa/Casablanca',
  'UTC',
] as const

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function normalizeBillingStatus(status: string | null): string | null {
  if (!status) return null

  const normalized = status.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function resolveBillingStatusKey(status: string | null): BillingStatusKey {
  if (!status || status === 'not_required') return 'billingStatusUnknown'
  if (status === 'active') return 'billingStatusActive'
  if (status === 'pending') return 'billingStatusPending'
  if (status === 'declined') return 'billingStatusDeclined'
  if (status === 'frozen') return 'billingStatusFrozen'
  if (status === 'expired') return 'billingStatusExpired'
  if (status === 'cancelled' || status === 'canceled') {
    return 'billingStatusCanceled'
  }
  if (status === 'error') return 'billingStatusError'
  return 'billingStatusUnknown'
}

function formatPlanId(planId: OnboardingBillingPlanId): string {
  return planId.charAt(0).toUpperCase() + planId.slice(1)
}

function parseIntegerField(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function toMinutesInput(value: number | null | undefined, fallback: number) {
  return String(value ?? fallback)
}

export function useSettings(): {
  isPageLoading: boolean
  skinProps: SettingsSkinProps
} {
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

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeNameError, setStoreNameError] = useState<string | undefined>()
  const [shippingCurrency, setShippingCurrency] = useState('USD')
  const [avgShippingCost, setAvgShippingCost] = useState('3')
  const [avgShippingCostError, setAvgShippingCostError] = useState<
    string | undefined
  >()
  const [defaultLanguage, setDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>('auto')
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(true)

  const [followUpEnabled, setFollowUpEnabled] = useState(true)
  const [sendDelayMinutes, setSendDelayMinutes] = useState('0')
  const [sendDelayMinutesError, setSendDelayMinutesError] = useState<
    string | undefined
  >()
  const [followUpDelayMinutes, setFollowUpDelayMinutes] = useState('120')
  const [followUpDelayMinutesError, setFollowUpDelayMinutesError] = useState<
    string | undefined
  >()
  const [escalationDelayMinutes, setEscalationDelayMinutes] = useState('360')
  const [escalationDelayMinutesError, setEscalationDelayMinutesError] =
    useState<string | undefined>()
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('21:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('09:00')
  const [quietHoursError, setQuietHoursError] = useState<string | undefined>()
  const [timezone, setTimezone] =
    useState<AutomationTimezone>('Asia/Riyadh')

  const [billingPlanId, setBillingPlanId] =
    useState<OnboardingBillingPlanId | null>(null)
  const [billingStatus, setBillingStatus] = useState<string | null>(null)
  const [billingManagementUrl, setBillingManagementUrl] = useState<
    string | null
  >(null)
  const [billingPlansById, setBillingPlansById] = useState<
    Partial<Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>>
  >({})
  const [selectedPlanId, setSelectedPlanId] =
    useState<OnboardingBillingPlanId | null>(null)
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [isFreePlanClaimed, setIsFreePlanClaimed] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  const languageOptions = useMemo<
    ReadonlyArray<SettingsSelectOption<IntegrationOnboardingLanguage>>
  >(
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

  const timezoneOptions = useMemo(
    () =>
      AUTOMATION_TIMEZONE_OPTIONS.map((tz) => ({
        label: t(`automation.timezones.${tz.replaceAll('/', '_')}`),
        value: tz,
      })),
    [t]
  )

  useEffect(() => {
    if (isModeLoading) return

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

        if (!active) return

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
        setFollowUpEnabled(state.followUpEnabled)
        setSendDelayMinutes(toMinutesInput(state.sendDelayMinutes, 0))
        setFollowUpDelayMinutes(
          toMinutesInput(state.followUpDelayMinutes, 120)
        )
        setEscalationDelayMinutes(
          toMinutesInput(state.escalationDelayMinutes, 360)
        )
        setQuietHoursEnabled(state.quietHoursEnabled)
        setQuietHoursStart(state.quietHoursStart ?? '21:00')
        setQuietHoursEnd(state.quietHoursEnd ?? '09:00')
        setTimezone(state.timezone)
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
        if (active) setErrorBanner(t('loadError'))
      } finally {
        if (active) setIsInitialLoading(false)
      }
    }

    void loadSettings()

    return () => {
      active = false
    }
  }, [isModeLoading, locale, router, t])

  useEffect(() => {
    setSelectedPlanId(billingPlanId)
  }, [billingPlanId])

  const activePlanName = useMemo(() => {
    if (!billingPlanId) return null
    return billingPlansById[billingPlanId]?.name ?? formatPlanId(billingPlanId)
  }, [billingPlanId, billingPlansById])

  const billingStatusLabel = useMemo(() => {
    const normalized = normalizeBillingStatus(billingStatus)
    const key = resolveBillingStatusKey(normalized)
    return t(key)
  }, [billingStatus, t])

  const planOptions = useMemo(() => {
    return ONBOARDING_BILLING_PLAN_IDS.map((id) => {
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

  const validateSettings = useCallback(() => {
    const trimmedStoreName = storeName.trim()
    const parsedAvgShippingCost = Number.parseFloat(avgShippingCost)
    const parsedSendDelay = parseIntegerField(sendDelayMinutes)
    const parsedFollowUpDelay = parseIntegerField(followUpDelayMinutes)
    const parsedEscalationDelay = parseIntegerField(escalationDelayMinutes)

    const nextStoreNameError = trimmedStoreName
      ? undefined
      : t('storeNameRequired')
    const nextAvgShippingCostError =
      Number.isFinite(parsedAvgShippingCost) && parsedAvgShippingCost >= 0
        ? undefined
        : t('avgShippingCostInvalid')
    const nextSendDelayMinutesError =
      parsedSendDelay !== null && parsedSendDelay >= 0 && parsedSendDelay <= 1440
        ? undefined
        : t('automation.validation.sendDelayMinutes')
    const nextFollowUpDelayMinutesError =
      !followUpEnabled ||
      (parsedFollowUpDelay !== null &&
        parsedFollowUpDelay >= 0 &&
        parsedFollowUpDelay <= 10080)
        ? undefined
        : t('automation.validation.followUpDelayMinutes')
    const nextEscalationDelayMinutesError =
      parsedEscalationDelay !== null &&
      parsedEscalationDelay >= 0 &&
      parsedEscalationDelay <= 10080
        ? undefined
        : t('automation.validation.escalationDelayMinutes')

    let nextQuietHoursError: string | undefined
    if (quietHoursEnabled) {
      if (!TIME_PATTERN.test(quietHoursStart) || !TIME_PATTERN.test(quietHoursEnd)) {
        nextQuietHoursError = t('automation.validation.quietHoursRequired')
      }
    }

    let resolvedFollowUpDelayError = nextFollowUpDelayMinutesError
    let resolvedEscalationDelayError = nextEscalationDelayMinutesError
    if (
      followUpEnabled &&
      !resolvedFollowUpDelayError &&
      !resolvedEscalationDelayError &&
      parsedFollowUpDelay !== null &&
      parsedEscalationDelay !== null &&
      parsedFollowUpDelay >= parsedEscalationDelay
    ) {
      resolvedFollowUpDelayError = t('automation.validation.followUpBeforeEscalation')
      resolvedEscalationDelayError = t('automation.validation.followUpBeforeEscalation')
    }

    setStoreNameError(nextStoreNameError)
    setAvgShippingCostError(nextAvgShippingCostError)
    setSendDelayMinutesError(nextSendDelayMinutesError)
    setFollowUpDelayMinutesError(resolvedFollowUpDelayError)
    setEscalationDelayMinutesError(resolvedEscalationDelayError)
    setQuietHoursError(nextQuietHoursError)

    if (
      nextStoreNameError ||
      nextAvgShippingCostError ||
      nextSendDelayMinutesError ||
      resolvedFollowUpDelayError ||
      resolvedEscalationDelayError ||
      nextQuietHoursError ||
      parsedSendDelay === null ||
      parsedEscalationDelay === null
    ) {
      return null
    }

    return {
      trimmedStoreName,
      avgShippingCost: Number(parsedAvgShippingCost.toFixed(2)),
      sendDelayMinutes: parsedSendDelay,
      followUpDelayMinutes: parsedFollowUpDelay ?? 0,
      escalationDelayMinutes: parsedEscalationDelay,
    }
  }, [
    avgShippingCost,
    escalationDelayMinutes,
    followUpDelayMinutes,
    followUpEnabled,
    quietHoursEnabled,
    quietHoursEnd,
    quietHoursStart,
    sendDelayMinutes,
    storeName,
    t,
  ])

  const handleSave = useCallback(async () => {
    setErrorBanner(null)
    setSuccessBanner(null)

    const validated = validateSettings()
    if (!validated) return

    setIsSaving(true)
    setSuccessBanner(t('saveSuccess'))
    shopify?.toast.show(t('saveSuccess'))

    const previous = {
      storeName,
      shippingCurrency,
      avgShippingCost,
      defaultLanguage,
      isAutoVerifyEnabled,
      followUpEnabled,
      sendDelayMinutes,
      followUpDelayMinutes,
      escalationDelayMinutes,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      timezone,
    }

    try {
      const { state } = await updateOnboardingSettings({
        storeName: validated.trimmedStoreName,
        defaultLanguage,
        isAutoVerifyEnabled,
        shippingCurrency,
        avgShippingCost: validated.avgShippingCost,
        followUpEnabled,
        sendDelayMinutes: validated.sendDelayMinutes,
        followUpDelayMinutes: followUpEnabled
          ? validated.followUpDelayMinutes
          : undefined,
        escalationDelayMinutes: validated.escalationDelayMinutes,
        quietHoursEnabled,
        quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
        quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
        timezone,
      })

      setStoreName(state.storeName ?? validated.trimmedStoreName)
      setShippingCurrency(state.shippingCurrency ?? shippingCurrency)
      setAvgShippingCost(String(state.avgShippingCost ?? validated.avgShippingCost))
      setDefaultLanguage(state.defaultLanguage)
      setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
      setFollowUpEnabled(state.followUpEnabled)
      setSendDelayMinutes(toMinutesInput(state.sendDelayMinutes, 0))
      setFollowUpDelayMinutes(toMinutesInput(state.followUpDelayMinutes, 120))
      setEscalationDelayMinutes(toMinutesInput(state.escalationDelayMinutes, 360))
      setQuietHoursEnabled(state.quietHoursEnabled)
      setQuietHoursStart(state.quietHoursStart ?? quietHoursStart)
      setQuietHoursEnd(state.quietHoursEnd ?? quietHoursEnd)
      setTimezone(state.timezone)
      setBillingPlanId(state.billingPlanId)
      setBillingStatus(state.billingStatus)
      setBillingManagementUrl(state.billingManagementUrl)
    } catch (error) {
      console.error('[Settings] Failed to save onboarding settings:', error)
      setSuccessBanner(null)
      setErrorBanner(t('saveError'))
      setStoreName(previous.storeName)
      setShippingCurrency(previous.shippingCurrency)
      setAvgShippingCost(previous.avgShippingCost)
      setDefaultLanguage(previous.defaultLanguage)
      setIsAutoVerifyEnabled(previous.isAutoVerifyEnabled)
      setFollowUpEnabled(previous.followUpEnabled)
      setSendDelayMinutes(previous.sendDelayMinutes)
      setFollowUpDelayMinutes(previous.followUpDelayMinutes)
      setEscalationDelayMinutes(previous.escalationDelayMinutes)
      setQuietHoursEnabled(previous.quietHoursEnabled)
      setQuietHoursStart(previous.quietHoursStart)
      setQuietHoursEnd(previous.quietHoursEnd)
      setTimezone(previous.timezone)
    } finally {
      setIsSaving(false)
    }
  }, [
    avgShippingCost,
    defaultLanguage,
    escalationDelayMinutes,
    followUpDelayMinutes,
    followUpEnabled,
    isAutoVerifyEnabled,
    quietHoursEnabled,
    quietHoursEnd,
    quietHoursStart,
    sendDelayMinutes,
    shippingCurrency,
    shopify,
    storeName,
    t,
    timezone,
    validateSettings,
  ])

  const handleManageBilling = useCallback(() => {
    if (!billingManagementUrl) {
      setErrorBanner(t('billingManagementUnavailable'))
      return
    }

    if (isEmbedded && window.top && window.top !== window.self) {
      window.open(billingManagementUrl, '_top')
      return
    }

    window.location.href = billingManagementUrl
  }, [billingManagementUrl, isEmbedded, t])

  const isPageLoading = isModeLoading || isInitialLoading
  useAppBridgeLoading(isEmbedded && isPageLoading)

  return {
    isPageLoading,
    skinProps: {
      storeName,
      storeNameError,
      defaultLanguage,
      languageOptions,
      shippingCurrency,
      shippingCurrencyOptions,
      avgShippingCost,
      avgShippingCostError,
      isAutoVerifyEnabled,
      followUpEnabled,
      sendDelayMinutes,
      sendDelayMinutesError,
      followUpDelayMinutes,
      followUpDelayMinutesError,
      escalationDelayMinutes,
      escalationDelayMinutesError,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      quietHoursError,
      timezone,
      timezoneOptions,
      isSaving,
      errorBanner,
      successBanner,
      activePlanName,
      billingPlanId,
      billingStatusLabel,
      billingManagementUrl,
      billingPlansById,
      selectedPlanId,
      planOptions,
      isChangingPlan,
      isFreePlanClaimed,
      usageData,
      onStoreNameChange: (value) => {
        setStoreName(value)
        setStoreNameError(undefined)
      },
      onDefaultLanguageChange: setDefaultLanguage,
      onShippingCurrencyChange: setShippingCurrency,
      onAvgShippingCostChange: (value) => {
        setAvgShippingCost(value)
        setAvgShippingCostError(undefined)
      },
      onAutoVerifyChange: setIsAutoVerifyEnabled,
      onFollowUpEnabledChange: setFollowUpEnabled,
      onSendDelayMinutesChange: (value) => {
        setSendDelayMinutes(value)
        setSendDelayMinutesError(undefined)
      },
      onFollowUpDelayMinutesChange: (value) => {
        setFollowUpDelayMinutes(value)
        setFollowUpDelayMinutesError(undefined)
        setEscalationDelayMinutesError(undefined)
      },
      onEscalationDelayMinutesChange: (value) => {
        setEscalationDelayMinutes(value)
        setFollowUpDelayMinutesError(undefined)
        setEscalationDelayMinutesError(undefined)
      },
      onQuietHoursEnabledChange: setQuietHoursEnabled,
      onQuietHoursStartChange: (value) => {
        setQuietHoursStart(value)
        setQuietHoursError(undefined)
      },
      onQuietHoursEndChange: (value) => {
        setQuietHoursEnd(value)
        setQuietHoursError(undefined)
      },
      onTimezoneChange: setTimezone,
      onSave: handleSave,
      onPlanSelect: setSelectedPlanId,
      onChangePlan: handleChangePlan,
      onManageBilling: handleManageBilling,
    },
  }
}
