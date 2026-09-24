'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  createOnboardingBilling,
  isFreePlanAlreadyClaimedError,
  OnboardingApiError,
  sendOnboardingTest,
  type OnboardingBillingPlanId,
} from '@/features/onboarding'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import { ApiError } from '@/shared/lib/http'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { createLogger } from '@/shared/lib/logger'
import { queryKeys } from '@/shared/query/keys'
import {
  fetchSettings,
  saveSettings,
  type SettingsResponse,
} from '../api/settingsApi'
import {
  dirtyTabs,
  fieldErrorFromApiCode,
  firstInvalidField,
  formFromSettings,
  suggestedTimezoneOnEnable,
  toSettingsPayload,
  validateSettingsForm,
  type SettingsFieldKey,
  type SettingsFormErrors,
  type SettingsFormValues,
} from './settingsForm'

const logger = createLogger('Settings')

const TEST_SEND_ERROR_KEYS: Record<string, string> = {
  ONBOARDING_TEST_COOLDOWN: 'testSendCooldown',
  ONBOARDING_TEST_DAILY_LIMIT: 'testSendDailyLimit',
  ONBOARDING_TEST_PHONE_MISSING: 'testSendPhoneMissing',
}

export type SaveOutcome =
  | { ok: true }
  | { ok: false; invalidField: SettingsFieldKey | null }

/**
 * State and actions for the embedded Settings page. The server response is
 * cached under `queryKeys.settings`; the form keeps its own working copy so
 * edits survive switching tabs, and `saved` is the baseline the save bar and
 * the per-tab indicators compare against.
 */
export function useEmbeddedSettings() {
  const t = useTranslations('settings.embedded')
  const { isLoading: isModeLoading, hostParam, shopify } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: fetchSettings,
    enabled: !isModeLoading,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  const data = query.data

  const [saved, setSaved] = useState<SettingsFormValues | null>(null)
  const [values, setValues] = useState<SettingsFormValues | null>(null)
  const [errors, setErrors] = useState<SettingsFormErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [subscribingPlanId, setSubscribingPlanId] =
    useState<OnboardingBillingPlanId | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)

  const applyResponse = useCallback((response: SettingsResponse) => {
    const next = formFromSettings(response.state, response.template)
    setSaved(next)
    setValues(next)
    setErrors({})
  }, [])

  // First load only: later refetches must not overwrite unsaved edits.
  useEffect(() => {
    if (data && saved === null) applyResponse(data)
  }, [applyResponse, data, saved])

  useEffect(() => {
    if (data?.state.onboardingStatus !== 'pending') return
    const search = typeof window !== 'undefined' ? window.location.search : ''
    router.replace(`/${locale}/onboarding${search}`)
  }, [data?.state.onboardingStatus, locale, router])

  const dirty = useMemo(
    () =>
      values && saved
        ? dirtyTabs(values, saved)
        : new Set<'message' | 'timing'>(),
    [saved, values]
  )

  const update = useCallback((patch: Partial<SettingsFormValues>) => {
    setValues((current) => (current ? { ...current, ...patch } : current))
    setErrors((current) => {
      const next = { ...current }
      if ('storeName' in patch) delete next.storeName
      if ('sendDelayCustom' in patch || 'sendDelayChoice' in patch) {
        delete next.sendDelayCustom
      }
      if (
        'quietHoursStart' in patch ||
        'quietHoursEnd' in patch ||
        'quietHoursEnabled' in patch
      ) {
        delete next.quietHours
      }
      if ('timezone' in patch) delete next.timezone
      return next
    })
    setSaveError(null)
  }, [])

  const setQuietHoursEnabled = useCallback(
    (enabled: boolean) => {
      if (!values || !saved) return
      const suggestion = enabled
        ? suggestedTimezoneOnEnable({
            saved,
            current: values,
            shopTimezone: data?.state.shopTimezone,
          })
        : null
      update(
        suggestion
          ? { quietHoursEnabled: enabled, timezone: suggestion }
          : { quietHoursEnabled: enabled }
      )
    },
    [data?.state.shopTimezone, saved, update, values]
  )

  const save = useCallback(async (): Promise<SaveOutcome> => {
    if (!values) return { ok: false, invalidField: null }
    const clientErrors = validateSettingsForm(values)
    const invalidField = firstInvalidField(clientErrors)
    if (invalidField) {
      setErrors(clientErrors)
      setSaveError(t('saveInvalid'))
      return { ok: false, invalidField }
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const response = await saveSettings(toSettingsPayload(values))
      queryClient.setQueryData(queryKeys.settings.detail(), response)
      applyResponse(response)
      shopify?.toast.show(t('saveSuccess'))
      return { ok: true }
    } catch (error) {
      logger.error('Failed to save settings', error)
      const serverErrors =
        error instanceof ApiError ? fieldErrorFromApiCode(error.code) : null
      if (serverErrors) setErrors(serverErrors)
      setSaveError(
        error instanceof ApiError && error.status === 403
          ? t('readOnly')
          : t('saveError')
      )
      return {
        ok: false,
        invalidField: serverErrors ? firstInvalidField(serverErrors) : null,
      }
    } finally {
      setIsSaving(false)
    }
  }, [applyResponse, queryClient, shopify, t, values])

  const discard = useCallback(() => {
    if (!saved || isSaving) return
    setValues(saved)
    setErrors({})
    setSaveError(null)
  }, [isSaving, saved])

  const sendTest = useCallback(async () => {
    setIsSendingTest(true)
    try {
      await sendOnboardingTest({ resend: true })
      shopify?.toast.show(t('testSendSuccess'))
    } catch (error) {
      logger.error('Failed to send test message', error)
      const key =
        (error instanceof OnboardingApiError && error.code
          ? TEST_SEND_ERROR_KEYS[error.code]
          : undefined) ?? 'testSendError'
      shopify?.toast.show(t(key), { isError: true })
    } finally {
      setIsSendingTest(false)
    }
  }, [shopify, t])

  const subscribe = useCallback(
    async (planId: OnboardingBillingPlanId) => {
      setPlanError(null)
      setSubscribingPlanId(planId)
      try {
        const { confirmationUrl } = await createOnboardingBilling(
          planId,
          hostParam ?? undefined
        )
        if (window.top && window.top !== window.self) {
          window.open(confirmationUrl, '_top')
        } else {
          window.location.href = confirmationUrl
        }
      } catch (error) {
        logger.error('Failed to start subscription', error)
        setPlanError(
          t(
            isFreePlanAlreadyClaimedError(error)
              ? 'plan.freePlanClaimedError'
              : 'plan.subscribeError'
          )
        )
        setSubscribingPlanId(null)
      }
    },
    [hostParam, t]
  )

  const isPageLoading =
    isModeLoading ||
    query.isPending ||
    (data !== undefined && values === null) ||
    data?.state.onboardingStatus === 'pending'
  useAppBridgeLoading(isPageLoading && !query.isError)

  return {
    data,
    values,
    errors,
    dirtyTabs: dirty,
    isDirty: dirty.size > 0,
    isPageLoading,
    isLoadError: query.isError,
    retry: () => void query.refetch(),
    canUpdateConfiguration:
      data?.state.permissions.canUpdateConfiguration ?? false,
    isSaving,
    saveError,
    dismissSaveError: () => setSaveError(null),
    update,
    setQuietHoursEnabled,
    save,
    discard,
    isSendingTest,
    sendTest,
    subscribingPlanId,
    planError,
    dismissPlanError: () => setPlanError(null),
    subscribe,
  }
}

export type EmbeddedSettingsModel = ReturnType<typeof useEmbeddedSettings>
