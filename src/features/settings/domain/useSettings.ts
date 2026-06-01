'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  createOnboardingBilling,
  ONBOARDING_BILLING_PLAN_IDS,
  type AutomationTimezone,
  type IntegrationOnboardingLanguage,
  type OnboardingBillingPlanConfig,
  type OnboardingBillingPlanId,
} from '@/features/onboarding'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { createLogger } from '@/shared/lib/logger'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { fetchSettings, updateSettings } from '../api/settingsApi'
import type { SettingsResponse } from '../api/settingsApi'
import type { SettingsSelectOption, SettingsSkinProps } from './settings.types'

const logger = createLogger('Settings')

type BillingStatusKey =
  | 'billingStatusActive'
  | 'billingStatusPending'
  | 'billingStatusDeclined'
  | 'billingStatusFrozen'
  | 'billingStatusExpired'
  | 'billingStatusCanceled'
  | 'billingStatusError'
  | 'billingStatusUnknown'

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

const DEFAULT_TEMPLATE_PREVIEWS: SettingsSkinProps['templatePreviews'] = {
  ar: {
    greeting: 'السلام عليكم',
    body: 'تم استلام طلبك رقم #{order_number} والدفع عند الاستلام',
    totalLabel: 'إجمالي السعر: {total}',
    ending: 'من فضلك أكد الطلب.',
    confirmButton: 'تأكيد',
    cancelButton: 'إلغاء',
  },
  en: {
    greeting: 'Hello',
    body: 'We have received your order #{order_number} with Cash on Delivery.',
    totalLabel: 'Total Price: {total}',
    ending: 'Please confirm your order.',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  },
}

const DEFAULT_COD_TEMPLATE_VARIANTS: SettingsSkinProps['selectedCodTemplateVariants']
  = {
    ar: 'standard',
    en: 'friendly',
  }

const DEFAULT_COD_TEMPLATE_DEFINITIONS: SettingsSkinProps['codTemplateVariants'] = {
  ar: [],
  en: [],
}

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

function parseHourField(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null

  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function hoursToMinutes(value: number): number {
  return Math.round(value * 60)
}

function toHoursInput(value: number | null | undefined, fallback: number) {
  const minutes = value ?? fallback
  const hours = minutes / 60
  return Number.isInteger(hours)
    ? String(hours)
    : String(Number(hours.toFixed(2)))
}

function formatDelayUnit(hours: number) {
  if (Number.isInteger(hours)) {
    return {
      value: hours,
      unit: hours === 1 ? 'hour' : 'hours',
    }
  }

  const minutes = Math.round(hours * 60)
  return {
    value: minutes,
    unit: minutes === 1 ? 'minute' : 'minutes',
  }
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

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeNameError, setStoreNameError] = useState<string | undefined>()
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
  const [escalationEnabled, setEscalationEnabled] = useState(true)
  const [escalationDelayMinutes, setEscalationDelayMinutes] = useState('360')
  const [escalationDelayMinutesError, setEscalationDelayMinutesError] =
    useState<string | undefined>()
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('21:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('09:00')
  const [quietHoursError, setQuietHoursError] = useState<string | undefined>()
  const [timezone, setTimezone] = useState<AutomationTimezone>('Asia/Riyadh')

  const [billingPlanId, setBillingPlanId] =
    useState<OnboardingBillingPlanId | null>(null)
  const [billingStatus, setBillingStatus] = useState<string | null>(null)
  const [billingPlansById, setBillingPlansById] = useState<
    Partial<Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>>
  >({})
  const [billingUsage, setBillingUsage] = useState<
    SettingsResponse['billing']['usage'] | null
  >(null)
  const [selectedPlanId, setSelectedPlanId] =
    useState<OnboardingBillingPlanId | null>(null)
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [isFreePlanClaimed, setIsFreePlanClaimed] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [templateLanguages, setTemplateLanguages] =
    useState<ReadonlyArray<'ar' | 'en'>>(['ar', 'en'])
  const [defaultTemplateLanguage, setDefaultTemplateLanguage] =
    useState<'ar' | 'en'>('en')
  const [codTemplateDefaults, setCodTemplateDefaults] =
    useState<SettingsSkinProps['codTemplateDefaults']>(
      DEFAULT_COD_TEMPLATE_VARIANTS
    )
  const [selectedCodTemplateVariants, setSelectedCodTemplateVariants] =
    useState<SettingsSkinProps['selectedCodTemplateVariants']>(
      DEFAULT_COD_TEMPLATE_VARIANTS
    )
  const [codTemplateVariants, setCodTemplateVariants] =
    useState<SettingsSkinProps['codTemplateVariants']>(
      DEFAULT_COD_TEMPLATE_DEFINITIONS
    )
  const [templatePreviews, setTemplatePreviews] =
    useState<SettingsSkinProps['templatePreviews']>(DEFAULT_TEMPLATE_PREVIEWS)

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
        const settingsResponse = await fetchSettings()

        if (!active) return

        const { state } = settingsResponse
        if (state.onboardingStatus === 'pending') {
          router.replace(`/${locale}/onboarding${search}`)
          return
        }

        setStoreName(state.storeName ?? '')
        setDefaultLanguage(state.defaultLanguage)
        setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
        setFollowUpEnabled(state.followUpEnabled)
        setSendDelayMinutes(toHoursInput(state.sendDelayMinutes, 0))
        setFollowUpDelayMinutes(toHoursInput(state.followUpDelayMinutes, 120))
        setEscalationEnabled(state.escalationEnabled)
        setEscalationDelayMinutes(
          toHoursInput(state.escalationDelayMinutes, 360)
        )
        setQuietHoursEnabled(state.quietHoursEnabled)
        setQuietHoursStart(state.quietHoursStart ?? '21:00')
        setQuietHoursEnd(state.quietHoursEnd ?? '09:00')
        setTimezone(state.timezone)
        setBillingPlanId(state.billingPlanId)
        setBillingStatus(state.billingStatus)

        const plansMap: Partial<
          Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>
        > = {}
        for (const plan of settingsResponse.billing.plans) {
          plansMap[plan.id] = plan
        }
        setBillingPlansById(plansMap)
        setIsFreePlanClaimed(settingsResponse.billing.isFreePlanClaimed)
        setBillingUsage(settingsResponse.billing.usage)
        setTemplateLanguages(settingsResponse.template.languages)
        setDefaultTemplateLanguage(settingsResponse.template.defaultPreviewLanguage)
        setCodTemplateDefaults(settingsResponse.template.defaults)
        setSelectedCodTemplateVariants(settingsResponse.template.selected)
        setCodTemplateVariants(settingsResponse.template.variants)
        setTemplatePreviews(settingsResponse.template.previews)
      } catch (error) {
        logger.error('Failed to load onboarding settings', error)
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
    if (!billingUsage) return null

    const { used, limit, periodStart, periodEnd } = billingUsage
    const safeLimit = Math.max(limit, 1)
    const usageRatio = used / safeLimit
    const percent = Math.min(100, Math.round(usageRatio * 100))

    return {
      used,
      limit,
      periodStart,
      periodEnd,
      usedLabel: t('usageUsedPercent', { value: percent }),
      limitLabel: t('usageMonthlyLimit'),
      upgradePrompt:
        used >= limit
          ? t('usageLimitReachedPrompt')
          : usageRatio >= 0.8
            ? t('usageUpgradePrompt')
            : null,
    }
  }, [billingUsage, t])

  const escalationReviewDescription = useMemo(() => {
    const parsed = parseHourField(escalationDelayMinutes) ?? 6
    const { value, unit } = formatDelayUnit(parsed)
    return t('automation.escalationReviewDescription', { value, unit })
  }, [escalationDelayMinutes, t])

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
      logger.error('Failed to change plan', error)
      setErrorBanner(t('changePlanError'))
    } finally {
      setIsChangingPlan(false)
    }
  }, [billingPlanId, hostParam, isEmbedded, selectedPlanId, t])

  const validateSettings = useCallback(() => {
    const trimmedStoreName = storeName.trim()
    const parsedSendDelayHours = parseHourField(sendDelayMinutes)
    const parsedFollowUpDelayHours = parseHourField(followUpDelayMinutes)
    const parsedEscalationDelayHours = parseHourField(escalationDelayMinutes)

    const nextStoreNameError = trimmedStoreName
      ? undefined
      : t('storeNameRequired')
    const nextSendDelayMinutesError =
      parsedSendDelayHours !== null &&
      parsedSendDelayHours >= 0 &&
      parsedSendDelayHours <= 720
        ? undefined
        : t('automation.validation.sendDelayMinutes')
    const nextFollowUpDelayMinutesError =
      !followUpEnabled ||
      (parsedFollowUpDelayHours !== null &&
        parsedFollowUpDelayHours >= 0 &&
        parsedFollowUpDelayHours <= 720)
        ? undefined
        : t('automation.validation.followUpDelayMinutes')
    const nextEscalationDelayMinutesError =
      !escalationEnabled ||
      (parsedEscalationDelayHours !== null &&
        parsedEscalationDelayHours >= 0 &&
        parsedEscalationDelayHours <= 720)
        ? undefined
        : t('automation.validation.escalationDelayMinutes')

    let nextQuietHoursError: string | undefined
    if (quietHoursEnabled) {
      if (
        !TIME_PATTERN.test(quietHoursStart) ||
        !TIME_PATTERN.test(quietHoursEnd)
      ) {
        nextQuietHoursError = t('automation.validation.quietHoursRequired')
      }
    }

    let resolvedFollowUpDelayError = nextFollowUpDelayMinutesError
    let resolvedEscalationDelayError = nextEscalationDelayMinutesError
    if (
      followUpEnabled &&
      escalationEnabled &&
      !resolvedFollowUpDelayError &&
      !resolvedEscalationDelayError &&
      parsedFollowUpDelayHours !== null &&
      parsedEscalationDelayHours !== null &&
      parsedFollowUpDelayHours >= parsedEscalationDelayHours
    ) {
      resolvedFollowUpDelayError = t(
        'automation.validation.followUpBeforeEscalation'
      )
      resolvedEscalationDelayError = t(
        'automation.validation.followUpBeforeEscalation'
      )
    }

    setStoreNameError(nextStoreNameError)
    setSendDelayMinutesError(nextSendDelayMinutesError)
    setFollowUpDelayMinutesError(resolvedFollowUpDelayError)
    setEscalationDelayMinutesError(resolvedEscalationDelayError)
    setQuietHoursError(nextQuietHoursError)

    if (
      nextStoreNameError ||
      nextSendDelayMinutesError ||
      resolvedFollowUpDelayError ||
      resolvedEscalationDelayError ||
      nextQuietHoursError ||
      parsedSendDelayHours === null ||
      (escalationEnabled && parsedEscalationDelayHours === null)
    ) {
      return null
    }

    return {
      trimmedStoreName,
      sendDelayMinutes: hoursToMinutes(parsedSendDelayHours),
      followUpDelayMinutes: parsedFollowUpDelayHours
        ? hoursToMinutes(parsedFollowUpDelayHours)
        : 0,
      escalationDelayMinutes: parsedEscalationDelayHours
        ? hoursToMinutes(parsedEscalationDelayHours)
        : 0,
    }
  }, [
    escalationDelayMinutes,
    escalationEnabled,
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

    const previous = {
      storeName,
      defaultLanguage,
      isAutoVerifyEnabled,
      followUpEnabled,
      sendDelayMinutes,
      followUpDelayMinutes,
      escalationEnabled,
      escalationDelayMinutes,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      timezone,
      selectedCodTemplateVariants,
    }

    try {
      const settingsResponse = await updateSettings({
        storeName: validated.trimmedStoreName,
        defaultLanguage,
        isAutoVerifyEnabled,
        followUpEnabled,
        sendDelayMinutes: validated.sendDelayMinutes,
        followUpDelayMinutes: followUpEnabled
          ? validated.followUpDelayMinutes
          : undefined,
        escalationEnabled,
        escalationDelayMinutes: escalationEnabled
          ? validated.escalationDelayMinutes
          : undefined,
        quietHoursEnabled,
        quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
        quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
        timezone,
        codTemplateArVariant: selectedCodTemplateVariants.ar,
        codTemplateEnVariant: selectedCodTemplateVariants.en,
      })
      const { state } = settingsResponse

      setStoreName(state.storeName ?? validated.trimmedStoreName)
      setDefaultLanguage(state.defaultLanguage)
      setIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
      setFollowUpEnabled(state.followUpEnabled)
      setSendDelayMinutes(toHoursInput(state.sendDelayMinutes, 0))
      setFollowUpDelayMinutes(toHoursInput(state.followUpDelayMinutes, 120))
      setEscalationEnabled(state.escalationEnabled)
      setEscalationDelayMinutes(toHoursInput(state.escalationDelayMinutes, 360))
      setQuietHoursEnabled(state.quietHoursEnabled)
      setQuietHoursStart(state.quietHoursStart ?? quietHoursStart)
      setQuietHoursEnd(state.quietHoursEnd ?? quietHoursEnd)
      setTimezone(state.timezone)
      setBillingPlanId(state.billingPlanId)
      setBillingStatus(state.billingStatus)
      const plansMap: Partial<
        Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>
      > = {}
      for (const plan of settingsResponse.billing.plans) {
        plansMap[plan.id] = plan
      }
      setBillingPlansById(plansMap)
      setIsFreePlanClaimed(settingsResponse.billing.isFreePlanClaimed)
      setBillingUsage(settingsResponse.billing.usage)
      setTemplateLanguages(settingsResponse.template.languages)
      setDefaultTemplateLanguage(settingsResponse.template.defaultPreviewLanguage)
      setCodTemplateDefaults(settingsResponse.template.defaults)
      setSelectedCodTemplateVariants(settingsResponse.template.selected)
      setCodTemplateVariants(settingsResponse.template.variants)
      setTemplatePreviews(settingsResponse.template.previews)
      setSuccessBanner(t('saveSuccess'))
      shopify?.toast.show(t('saveSuccess'))
    } catch (error) {
      logger.error('Failed to save onboarding settings', error)
      setSuccessBanner(null)
      setErrorBanner(t('saveError'))
      setStoreName(previous.storeName)
      setDefaultLanguage(previous.defaultLanguage)
      setIsAutoVerifyEnabled(previous.isAutoVerifyEnabled)
      setFollowUpEnabled(previous.followUpEnabled)
      setSendDelayMinutes(previous.sendDelayMinutes)
      setFollowUpDelayMinutes(previous.followUpDelayMinutes)
      setEscalationEnabled(previous.escalationEnabled)
      setEscalationDelayMinutes(previous.escalationDelayMinutes)
      setQuietHoursEnabled(previous.quietHoursEnabled)
      setQuietHoursStart(previous.quietHoursStart)
      setQuietHoursEnd(previous.quietHoursEnd)
      setTimezone(previous.timezone)
      setSelectedCodTemplateVariants(previous.selectedCodTemplateVariants)
    } finally {
      setIsSaving(false)
    }
  }, [
    defaultLanguage,
    escalationDelayMinutes,
    escalationEnabled,
    followUpDelayMinutes,
    followUpEnabled,
    isAutoVerifyEnabled,
    quietHoursEnabled,
    quietHoursEnd,
    quietHoursStart,
    sendDelayMinutes,
    shopify,
    selectedCodTemplateVariants,
    storeName,
    t,
    timezone,
    validateSettings,
  ])

  const isPageLoading = isModeLoading || isInitialLoading
  useAppBridgeLoading(isEmbedded && isPageLoading)

  return {
    isPageLoading,
    skinProps: {
      storeName,
      storeNameError,
      defaultLanguage,
      languageOptions,
      isAutoVerifyEnabled,
      followUpEnabled,
      sendDelayMinutes,
      sendDelayMinutesError,
      followUpDelayMinutes,
      followUpDelayMinutesError,
      escalationEnabled,
      escalationDelayMinutes,
      escalationDelayMinutesError,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      quietHoursError,
      timezone,
      timezoneOptions,
      escalationReviewDescription,
      isSaving,
      errorBanner,
      successBanner,
      activePlanName,
      billingPlanId,
      billingStatusLabel,
      billingPlansById,
      selectedPlanId,
      planOptions,
      isChangingPlan,
      isFreePlanClaimed,
      usageData,
      templateLanguages,
      defaultTemplateLanguage,
      codTemplateDefaults,
      selectedCodTemplateVariants,
      codTemplateVariants,
      templatePreviews,
      onStoreNameChange: (value) => {
        setStoreName(value)
        setStoreNameError(undefined)
      },
      onDefaultLanguageChange: setDefaultLanguage,
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
      onEscalationEnabledChange: setEscalationEnabled,
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
      onCodTemplateArVariantChange: (value) => {
        setSelectedCodTemplateVariants((current) => ({
          ...current,
          ar: value,
        }))
      },
      onCodTemplateEnVariantChange: (value) => {
        setSelectedCodTemplateVariants((current) => ({
          ...current,
          en: value,
        }))
      },
      onSave: handleSave,
      onPlanSelect: setSelectedPlanId,
      onChangePlan: handleChangePlan,
    },
  }
}
