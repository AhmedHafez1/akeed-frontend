'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  completeStandaloneOnboarding,
  fetchOnboardingState,
  OnboardingApiError,
  updateOnboardingSettings,
} from '@/features/onboarding/api/onboardingApi'
import type {
  AutomationTimezone,
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
  OnboardingSettingsPayload,
  StandaloneSetupBlockedReason,
  StandaloneSetupFieldErrors,
  StandaloneSetupFieldKey,
  StandaloneStep,
} from '@/features/onboarding/domain/onboarding.types'
import {
  STANDALONE_FIELD_ORDER,
  STANDALONE_FIELD_STEP,
} from '@/features/onboarding/model/onboarding.steps'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('StandaloneOnboarding')
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

interface StandaloneSetupForm {
  storeName: string
  defaultLanguage: IntegrationOnboardingLanguage
  assumeCodWhenPaymentMissing: boolean
  isAutoVerifyEnabled: boolean
  timezone: AutomationTimezone
  sendDelayHours: string
  followUpEnabled: boolean
  followUpDelayHours: string
  escalationEnabled: boolean
  escalationDelayHours: string
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

type FieldErrors = StandaloneSetupFieldErrors

/** Outcome of an attempted save, so the page can react without re-validating. */
export interface StandaloneSaveResult {
  state: IntegrationOnboardingState | null
  firstInvalidField: StandaloneSetupFieldKey | null
  errorStep: StandaloneStep | null
}

const defaultForm: StandaloneSetupForm = {
  storeName: '',
  defaultLanguage: 'auto',
  assumeCodWhenPaymentMissing: false,
  isAutoVerifyEnabled: false,
  timezone: 'Asia/Riyadh',
  sendDelayHours: '0',
  followUpEnabled: true,
  followUpDelayHours: '2',
  escalationEnabled: true,
  escalationDelayHours: '6',
  quietHoursEnabled: false,
  quietHoursStart: '21:00',
  quietHoursEnd: '09:00',
}

function minutesToHours(minutes: number) {
  const hours = minutes / 60
  return Number.isInteger(hours)
    ? String(hours)
    : String(Number(hours.toFixed(2)))
}

function stateToForm(state: IntegrationOnboardingState): StandaloneSetupForm {
  return {
    storeName: state.storeName ?? '',
    defaultLanguage: state.defaultLanguage,
    assumeCodWhenPaymentMissing: state.assumeCodWhenPaymentMissing,
    isAutoVerifyEnabled: state.isAutoVerifyEnabled,
    timezone: state.timezone,
    sendDelayHours: minutesToHours(state.sendDelayMinutes),
    followUpEnabled: state.followUpEnabled,
    followUpDelayHours: minutesToHours(state.followUpDelayMinutes),
    escalationEnabled: state.escalationEnabled,
    escalationDelayHours: minutesToHours(state.escalationDelayMinutes),
    quietHoursEnabled: state.quietHoursEnabled,
    quietHoursStart: state.quietHoursStart ?? '21:00',
    quietHoursEnd: state.quietHoursEnd ?? '09:00',
  }
}

function parseHours(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function firstErrorField(
  errors: FieldErrors,
  step?: StandaloneStep
): StandaloneSetupFieldKey | null {
  for (const field of STANDALONE_FIELD_ORDER) {
    if (!errors[field]) continue
    if (step !== undefined && STANDALONE_FIELD_STEP[field] !== step) continue
    return field
  }
  return null
}

/**
 * Builds the settings payload from the form. Pure: it reports errors instead of
 * writing them, so the same rules can back both per-step validation and save.
 * The payload it produces is byte-for-byte what the endpoint accepted before.
 */
function buildPayload(
  form: StandaloneSetupForm,
  t: (key: string) => string
): { payload: OnboardingSettingsPayload | null; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const sendHours = parseHours(form.sendDelayHours)
  const followUpHours = parseHours(form.followUpDelayHours)
  const escalationHours = parseHours(form.escalationDelayHours)

  if (!form.storeName.trim()) errors.storeName = t('validation.name')
  if (sendHours === null || sendHours < 0 || sendHours > 24) {
    errors.sendDelayHours = t('validation.sendDelay')
  }
  if (
    form.followUpEnabled &&
    (followUpHours === null || followUpHours < 0 || followUpHours > 168)
  ) {
    errors.followUpDelayHours = t('validation.followUpDelay')
  }
  if (
    form.escalationEnabled &&
    (escalationHours === null || escalationHours < 0 || escalationHours > 168)
  ) {
    errors.escalationDelayHours = t('validation.escalationDelay')
  }
  if (
    form.followUpEnabled &&
    form.escalationEnabled &&
    followUpHours !== null &&
    escalationHours !== null &&
    followUpHours >= escalationHours
  ) {
    errors.followUpDelayHours = t('validation.followUpBeforeEscalation')
    errors.escalationDelayHours = t('validation.followUpBeforeEscalation')
  }
  if (
    form.quietHoursEnabled &&
    (!TIME_PATTERN.test(form.quietHoursStart) ||
      !TIME_PATTERN.test(form.quietHoursEnd))
  ) {
    errors.quietHours = t('validation.quietHours')
  }

  if (Object.keys(errors).length > 0 || sendHours === null) {
    return { payload: null, errors }
  }

  return {
    errors,
    payload: {
      storeName: form.storeName.trim(),
      defaultLanguage: form.defaultLanguage,
      assumeCodWhenPaymentMissing: form.assumeCodWhenPaymentMissing,
      isAutoVerifyEnabled: form.isAutoVerifyEnabled,
      timezone: form.timezone,
      sendDelayMinutes: Math.round(sendHours * 60),
      followUpEnabled: form.followUpEnabled,
      followUpDelayMinutes:
        form.followUpEnabled && followUpHours !== null
          ? Math.round(followUpHours * 60)
          : undefined,
      escalationEnabled: form.escalationEnabled,
      escalationDelayMinutes:
        form.escalationEnabled && escalationHours !== null
          ? Math.round(escalationHours * 60)
          : undefined,
      quietHoursEnabled: form.quietHoursEnabled,
      quietHoursStart: form.quietHoursEnabled
        ? form.quietHoursStart
        : undefined,
      quietHoursEnd: form.quietHoursEnabled ? form.quietHoursEnd : undefined,
    },
  }
}

export function useStandaloneOnboarding() {
  const t = useTranslations('standaloneOnboarding')
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const [state, setState] = useState<IntegrationOnboardingState | null>(null)
  const [form, setForm] = useState<StandaloneSetupForm>(defaultForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadErrorCode(null)
    setErrorMessage(null)
    try {
      const response = await fetchOnboardingState()
      setState(response.state)
      setForm(stateToForm(response.state))
      if (response.state.isOnboardingComplete) {
        router.replace(`/${locale}/dashboard`)
      }
    } catch (error) {
      logger.error('Failed to load Standalone onboarding', error)
      setLoadErrorCode(
        error instanceof OnboardingApiError ? error.code : 'UNAVAILABLE'
      )
    } finally {
      setIsLoading(false)
    }
  }, [locale, router])

  useEffect(() => {
    void load()
  }, [load])

  const setField = useCallback(
    <TKey extends keyof StandaloneSetupForm>(
      key: TKey,
      value: StandaloneSetupForm[TKey]
    ) => {
      setForm((current) => ({ ...current, [key]: value }))
      setFieldErrors((current) => ({ ...current, [key]: undefined }))
      setSuccessMessage(null)
    },
    []
  )

  /** Clears a stale "saved" banner without touching entered values. */
  const resetSuccess = useCallback(() => setSuccessMessage(null), [])

  /**
   * Validates the whole form but only reports failures owned by `step`, so a
   * user cannot be blocked on step one by a field that lives on step two.
   */
  const validateStep = useCallback(
    (step: StandaloneStep) => {
      const { errors } = buildPayload(form, t)
      setFieldErrors(errors)
      const field = firstErrorField(errors, step)
      return { ok: field === null, firstInvalidField: field }
    },
    [form, t]
  )

  const save = useCallback(async (): Promise<StandaloneSaveResult> => {
    setErrorMessage(null)
    setSuccessMessage(null)

    const { payload, errors } = buildPayload(form, t)
    setFieldErrors(errors)

    if (!payload) {
      const field = firstErrorField(errors)
      return {
        state: null,
        firstInvalidField: field,
        errorStep: field ? STANDALONE_FIELD_STEP[field] : null,
      }
    }

    setIsSaving(true)
    try {
      const response = await updateOnboardingSettings(payload)
      setState(response.state)
      setForm(stateToForm(response.state))
      setSuccessMessage(t('saved'))
      return {
        state: response.state,
        firstInvalidField: null,
        errorStep: null,
      }
    } catch (error) {
      logger.error('Failed to save Standalone onboarding', error)
      setErrorMessage(
        error instanceof OnboardingApiError && error.status === 403
          ? t('readOnly')
          : t('saveError')
      )
      return { state: null, firstInvalidField: null, errorStep: null }
    } finally {
      setIsSaving(false)
    }
  }, [form, t])

  const complete = useCallback(async (): Promise<StandaloneSaveResult> => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsCompleting(true)
    try {
      const saved = await save()
      if (!saved.state) return saved
      const response = await completeStandaloneOnboarding()
      setState(response.state)
      router.replace(`/${locale}/dashboard`)
      return { state: response.state, firstInvalidField: null, errorStep: null }
    } catch (error) {
      logger.error('Failed to complete Standalone onboarding', error)
      if (error instanceof OnboardingApiError) {
        if (error.status === 403) {
          setErrorMessage(t('readOnly'))
          return { state: null, firstInvalidField: null, errorStep: null }
        }
        if (error.blockedReasons.length > 0) {
          const awaitingApproval =
            error.code === 'STANDALONE_APPROVAL_REQUIRED' ||
            error.blockedReasons.includes('approval_required')
          setState((current) =>
            current
              ? {
                  ...current,
                  standaloneSetup: {
                    canComplete: false,
                    blockedReasons: error.blockedReasons,
                    approvalStatus: awaitingApproval
                      ? (current.standaloneSetup?.approvalStatus ??
                        'pending_approval')
                      : (current.standaloneSetup?.approvalStatus ?? null),
                  },
                }
              : current
          )
          // Waiting for staff is not the merchant's error to fix, so the page
          // switches to the approval state instead of showing a red banner.
          if (!awaitingApproval) setErrorMessage(t('blocked'))
          return { state: null, firstInvalidField: null, errorStep: null }
        }
      }
      setErrorMessage(t('completeError'))
      return { state: null, firstInvalidField: null, errorStep: null }
    } finally {
      setIsCompleting(false)
    }
  }, [locale, router, save, t])

  return {
    state,
    form,
    fieldErrors,
    isLoading,
    isSaving,
    isCompleting,
    loadErrorCode,
    errorMessage,
    successMessage,
    blockedReasons:
      state?.standaloneSetup?.blockedReasons ??
      ([] as StandaloneSetupBlockedReason[]),
    approvalStatus: state?.standaloneSetup?.approvalStatus ?? null,
    canManage: state?.permissions.canUpdateConfiguration === true,
    setField,
    resetSuccess,
    validateStep,
    retry: load,
    save,
    complete,
  }
}

export type { StandaloneSetupForm }
export type UseStandaloneOnboarding = ReturnType<typeof useStandaloneOnboarding>
