'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { OnboardingApiError, sendOnboardingTest } from '@/features/onboarding'
import { ApiError } from '@/shared/lib/http'
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
  type SettingsEditableTab,
  type SettingsFieldKey,
  type SettingsFormErrors,
  type SettingsFormValues,
} from './settingsForm'

const logger = createLogger('Settings')

type TestSendErrorKey =
  | 'testSendCooldown'
  | 'testSendDailyLimit'
  | 'testSendError'

const TEST_SEND_ERROR_KEYS: Partial<Record<string, TestSendErrorKey>> = {
  ONBOARDING_TEST_COOLDOWN: 'testSendCooldown',
  ONBOARDING_TEST_DAILY_LIMIT: 'testSendDailyLimit',
}

export type SaveOutcome =
  | { ok: true }
  | { ok: false; invalidField: SettingsFieldKey | null }

/** `phoneMissing` is not reported: the skin asks for the number instead. */
export type TestSendOutcome = 'sent' | 'phoneMissing' | 'failed'

export type SaveTestPhoneOutcome =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'readOnly' | 'saveFailed' }

/** The model's messages, already translated from the skin's own namespace. */
export interface SettingsModelMessages extends Record<
  TestSendErrorKey,
  string
> {
  saveSuccess: string
  saveInvalid: string
  saveError: string
  readOnly: string
  testSendSuccess: string
}

/** Which action a reported failure belongs to. */
export type SettingsModelErrorSource = 'save' | 'testSend'

/**
 * How the model reports outside the form: App Bridge in Shopify Admin, toasts
 * in the standalone app. Pass a stable object (memoise it).
 */
export interface SettingsModelAdapter {
  notifySuccess(message: string): void
  /** A failed save also sets `saveError`; the adapter may skip its notice. */
  notifyError(message: string, source: SettingsModelErrorSource): void
  /** The first load: true until the form can be shown or the load failed. */
  onLoadingChange?(isLoading: boolean): void
}

export interface SettingsModelOptions {
  /** False until the runtime mode is known, so the request carries auth. */
  enabled: boolean
  messages: SettingsModelMessages
  adapter: SettingsModelAdapter
}

/**
 * The Settings form shared by both skins. The server response is cached under
 * `queryKeys.settings`; the form keeps its own working copy so edits survive
 * switching tabs, and `saved` is the baseline the save bar and the per-tab
 * indicators compare against.
 */
export function useSettingsModel({
  enabled,
  messages,
  adapter,
}: SettingsModelOptions) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: fetchSettings,
    enabled,
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

  const dirty = useMemo(
    () =>
      values && saved
        ? dirtyTabs(values, saved)
        : new Set<SettingsEditableTab>(),
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
    (quietHoursEnabled: boolean) => {
      if (!values || !saved) return
      const suggestion = quietHoursEnabled
        ? suggestedTimezoneOnEnable({
            saved,
            current: values,
            shopTimezone: data?.state.shopTimezone,
          })
        : null
      update(
        suggestion
          ? { quietHoursEnabled, timezone: suggestion }
          : { quietHoursEnabled }
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
      setSaveError(messages.saveInvalid)
      return { ok: false, invalidField }
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const response = await saveSettings(toSettingsPayload(values))
      queryClient.setQueryData(queryKeys.settings.detail(), response)
      applyResponse(response)
      adapter.notifySuccess(messages.saveSuccess)
      return { ok: true }
    } catch (error) {
      logger.error('Failed to save settings', error)
      const serverErrors =
        error instanceof ApiError ? fieldErrorFromApiCode(error.code) : null
      if (serverErrors) setErrors(serverErrors)
      const message =
        error instanceof ApiError && error.status === 403
          ? messages.readOnly
          : messages.saveError
      setSaveError(message)
      adapter.notifyError(message, 'save')
      return {
        ok: false,
        invalidField: serverErrors ? firstInvalidField(serverErrors) : null,
      }
    } finally {
      setIsSaving(false)
    }
  }, [adapter, applyResponse, messages, queryClient, values])

  const discard = useCallback(() => {
    if (!saved || isSaving) return
    setValues(saved)
    setErrors({})
    setSaveError(null)
  }, [isSaving, saved])

  const sendTest = useCallback(async (): Promise<TestSendOutcome> => {
    setIsSendingTest(true)
    try {
      await sendOnboardingTest({ resend: true })
      adapter.notifySuccess(messages.testSendSuccess)
      return 'sent'
    } catch (error) {
      const code = error instanceof OnboardingApiError ? error.code : null
      if (code === 'ONBOARDING_TEST_PHONE_MISSING') return 'phoneMissing'
      logger.error('Failed to send test message', error)
      const key =
        (code ? TEST_SEND_ERROR_KEYS[code] : undefined) ?? 'testSendError'
      adapter.notifyError(messages[key], 'testSend')
      return 'failed'
    } finally {
      setIsSendingTest(false)
    }
  }, [adapter, messages])

  /**
   * Saves the number the free test goes to. It is sent with the saved
   * settings, not the working copy, so unsaved edits are neither stored nor
   * lost.
   */
  const saveTestPhone = useCallback(
    async (phone: string): Promise<SaveTestPhoneOutcome> => {
      if (!saved) return { ok: false, reason: 'saveFailed' }
      try {
        const response = await saveSettings({
          ...toSettingsPayload(saved),
          merchantWhatsappPhone: phone,
        })
        queryClient.setQueryData(queryKeys.settings.detail(), response)
        return { ok: true }
      } catch (error) {
        logger.error('Failed to save the test number', error)
        if (error instanceof ApiError) {
          if (error.code === 'ONBOARDING_INVALID_PHONE') {
            return { ok: false, reason: 'invalid' }
          }
          if (error.status === 403) return { ok: false, reason: 'readOnly' }
        }
        return { ok: false, reason: 'saveFailed' }
      }
    },
    [queryClient, saved]
  )

  // Setup is not finished: the skin redirects, so there is no form to show.
  const isPageLoading =
    !enabled ||
    query.isPending ||
    (data !== undefined && values === null) ||
    data?.state.onboardingStatus === 'pending'
  const isLoadError = query.isError

  const { onLoadingChange } = adapter
  useEffect(() => {
    onLoadingChange?.(isPageLoading && !isLoadError)
  }, [isLoadError, isPageLoading, onLoadingChange])

  return {
    data,
    values,
    errors,
    dirtyTabs: dirty,
    isDirty: dirty.size > 0,
    isPageLoading,
    isLoadError,
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
    saveTestPhone,
  }
}

export type SettingsModel = ReturnType<typeof useSettingsModel>
