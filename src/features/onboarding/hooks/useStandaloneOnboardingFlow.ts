'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import {
  fetchOnboardingState,
  OnboardingApiError,
  sendOnboardingTest,
  updateOnboardingSettings,
} from '@/features/onboarding/api/onboardingApi'
import type {
  AutomationTimezone,
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
  SetupBlockedReason,
  StandaloneSetupBlockedReason,
  StandaloneStep,
  StandaloneStoreFieldErrors,
  StandaloneStoreFieldKey,
} from '@/features/onboarding/domain/onboarding.types'
import { inferRegionalDefaults } from '@/features/onboarding/model/regionalDefaults'
import {
  buildStoreSettingsPayload,
  countryFromLanguages,
  countryFromPhone,
  firstInvalidField,
  isAutomationTimezone,
  parseStandaloneStep,
  resolveStandaloneStep,
  validateStoreForm,
  type StandaloneStoreForm,
} from '@/features/onboarding/model/standaloneStore'
import { isTestProviderUnavailable, toTestError } from './useOnboardingTest'
import {
  useOnboardingTestCompletion,
  type OnboardingTestSendError,
} from './useOnboardingTestCompletion'
import {
  isOrderCurrency,
  type OrderCurrency,
} from '@/shared/commerce/orderCommerce'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { createLogger } from '@/shared/lib/logger'
import { queryKeys } from '@/shared/query/keys'
import type { PhoneCountry } from '@/shared/ui/international-phone-input'

const logger = createLogger('Onboarding')

type DefaultKey = 'language' | 'currency' | 'timezone'
type TouchedDefaults = Record<DefaultKey, boolean>

export type StandaloneTestSendError = OnboardingTestSendError

export interface SubmitStoreResult {
  ok: boolean
  firstInvalidField: StandaloneStoreFieldKey | null
}

function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

function browserCountry(): PhoneCountry {
  if (typeof navigator === 'undefined') return countryFromLanguages([])
  return countryFromLanguages(
    navigator.languages?.length ? navigator.languages : [navigator.language]
  )
}

/**
 * Currency and timezone guessed from the number (or, while it is blank, the
 * country picked in the phone input).
 */
function inferFor(phone: string, country: PhoneCountry) {
  return inferRegionalDefaults({
    phoneE164: phone || undefined,
    countryHint: country,
    browserTimeZone: browserTimeZone(),
  })
}

function initialForm(state: IntegrationOnboardingState): {
  form: StandaloneStoreForm
  touched: TouchedDefaults
} {
  const phone = state.merchantWhatsappPhone ?? ''
  const phoneCountry = (phone && countryFromPhone(phone)) || browserCountry()
  const inferred = inferFor(phone, phoneCountry)
  // A saved number means these were chosen (or accepted) already; keep them.
  const savedCurrency =
    phone && isOrderCurrency(state.shippingCurrency)
      ? state.shippingCurrency
      : null
  const savedTimezone =
    phone && isAutomationTimezone(state.timezone) ? state.timezone : null
  return {
    form: {
      storeName: state.storeName ?? '',
      phone,
      phoneCountry,
      language: state.defaultLanguage,
      currency: savedCurrency ?? inferred.currency,
      timezone: savedTimezone ?? inferred.timezone,
    },
    touched: {
      language: !!phone,
      currency: !!savedCurrency,
      timezone: !!savedTimezone,
    },
  }
}

function urlWithStep(step: StandaloneStep) {
  const url = new URL(window.location.href)
  url.searchParams.set('step', step)
  return `${url.pathname}${url.search}${url.hash}`
}

const EMPTY_FORM: StandaloneStoreForm = {
  storeName: '',
  phone: '',
  phoneCountry: 'EG',
  language: 'auto',
  currency: 'EGP',
  timezone: 'Africa/Cairo',
}

/**
 * Standalone onboarding v2: Your store → Try the message → You're live.
 *
 * The URL (`?step=`) is the one source of truth for the step, so refresh and
 * Back work. Store → test is a history push (Back returns to the form with
 * its values); the success screen replaces the entry and never navigates, so
 * AuthGuard does not bounce a just-completed account off this route.
 *
 * `/complete` is only ever called after the test is confirmed, skipped, or
 * Akeed's WhatsApp is unavailable, never from the setup submit.
 */
export function useStandaloneOnboardingFlow() {
  const t = useTranslations('standaloneOnboarding')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const locale = getLocaleFromPathname(pathname ?? '')

  const [state, setState] = useState<IntegrationOnboardingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [form, setForm] = useState<StandaloneStoreForm>(EMPTY_FORM)
  const [touched, setTouched] = useState<TouchedDefaults>({
    language: false,
    currency: false,
    timezone: false,
  })
  const [fieldErrors, setFieldErrors] = useState<StandaloneStoreFieldErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requestedStep = parseStandaloneStep(searchParams?.get('step'))
  const dashboardPath = `/${locale}/dashboard`

  const goToStep = useCallback((next: StandaloneStep) => {
    window.history.pushState(null, '', urlWithStep(next))
  }, [])

  // A blocked /complete replaces what the state said could be completed.
  const showBlockedReasons = useCallback((reasons: SetupBlockedReason[]) => {
    const suspended = reasons.includes('account_suspended')
    setState((current) =>
      current
        ? {
            ...current,
            standaloneSetup: {
              canComplete: false,
              blockedReasons: reasons as StandaloneSetupBlockedReason[],
              accountStatus: suspended
                ? 'suspended'
                : (current.standaloneSetup?.accountStatus ?? null),
            },
          }
        : current
    )
  }, [])
  const backToStore = useCallback(() => goToStep('store'), [goToStep])
  const doneUrl = useCallback(() => urlWithStep('done'), [])
  const readOnlyMessage = t('readOnly')
  const completeErrorMessage = t('completeError')

  const completion = useOnboardingTestCompletion({
    isTestStep:
      !!state && resolveStandaloneStep(state, requestedStep) === 'test',
    dashboardPath,
    doneUrl,
    messages: {
      readOnly: readOnlyMessage,
      completeError: completeErrorMessage,
    },
    onCompleted: setState,
    onBlocked: showBlockedReasons,
    onChangeNumber: backToStore,
  })
  const { setSubmitTestError } = completion

  const step: StandaloneStep = completion.isDone
    ? 'done'
    : state
      ? resolveStandaloneStep(state, requestedStep)
      : (requestedStep ?? 'store')

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      const response = await fetchOnboardingState()
      if (response.state.isOnboardingComplete) {
        router.replace(dashboardPath)
        return
      }
      const initial = initialForm(response.state)
      setState(response.state)
      setForm(initial.form)
      setTouched(initial.touched)
    } catch (error) {
      logger.error('Failed to load standalone onboarding', error)
      setLoadErrorCode(
        error instanceof OnboardingApiError
          ? (error.code ?? 'UNAVAILABLE')
          : 'UNAVAILABLE'
      )
    } finally {
      setIsLoading(false)
    }
  }, [dashboardPath, router])

  useEffect(() => {
    void load()
  }, [load])

  // Keep the URL naming the step actually shown (resume rules, bad values).
  useEffect(() => {
    if (!state || requestedStep === step) return
    window.history.replaceState(null, '', urlWithStep(step))
  }, [requestedStep, state, step])

  // ── Your store ────────────────────────────────────────────────────────────

  const setStoreName = useCallback((storeName: string) => {
    setForm((current) => ({ ...current, storeName }))
    setFieldErrors((current) => ({ ...current, storeName: undefined }))
  }, [])

  const applyInference = useCallback(
    (next: StandaloneStoreForm, currentTouched: TouchedDefaults) => {
      const inferred = inferFor(next.phone, next.phoneCountry)
      return {
        ...next,
        currency: currentTouched.currency ? next.currency : inferred.currency,
        timezone: currentTouched.timezone ? next.timezone : inferred.timezone,
      }
    },
    []
  )

  const setPhone = useCallback(
    (phone: string) => {
      setForm((current) =>
        applyInference(
          {
            ...current,
            phone,
            phoneCountry:
              (phone && countryFromPhone(phone)) || current.phoneCountry,
          },
          touched
        )
      )
      setFieldErrors((current) => ({
        ...current,
        merchantWhatsappPhone: undefined,
      }))
    },
    [applyInference, touched]
  )

  const setPhoneCountry = useCallback(
    (phoneCountry: PhoneCountry) => {
      setForm((current) =>
        current.phoneCountry === phoneCountry
          ? current
          : applyInference({ ...current, phoneCountry }, touched)
      )
    },
    [applyInference, touched]
  )

  const setLanguage = useCallback((language: IntegrationOnboardingLanguage) => {
    setForm((current) => ({ ...current, language }))
    setTouched((current) => ({ ...current, language: true }))
  }, [])

  const setCurrency = useCallback((currency: OrderCurrency) => {
    setForm((current) => ({ ...current, currency }))
    setTouched((current) => ({ ...current, currency: true }))
  }, [])

  const setTimezone = useCallback((timezone: AutomationTimezone) => {
    setForm((current) => ({ ...current, timezone }))
    setTouched((current) => ({ ...current, timezone: true }))
  }, [])

  const canManage = state?.permissions.canUpdateConfiguration === true

  const submitStore = useCallback(async (): Promise<SubmitStoreResult> => {
    if (!canManage) return { ok: false, firstInvalidField: null }
    setSaveError(null)
    const errors = validateStoreForm(form, {
      storeNameRequired: t('store.validation.storeName'),
      phoneInvalid: (hint) => t('store.validation.phone', { ...hint }),
    })
    setFieldErrors(errors)
    const invalid = firstInvalidField(errors)
    if (invalid) return { ok: false, firstInvalidField: invalid }

    setIsSubmitting(true)
    try {
      try {
        const saved = await updateOnboardingSettings(
          buildStoreSettingsPayload(form)
        )
        setState(saved.state)
      } catch (error) {
        logger.error('Failed to save standalone store settings', error)
        setSaveError(
          error instanceof OnboardingApiError && error.status === 403
            ? t('readOnly')
            : t('store.saveError')
        )
        return { ok: false, firstInvalidField: null }
      }

      try {
        const test = await sendOnboardingTest({ resend: false })
        queryClient.setQueryData(queryKeys.onboarding.test(), test)
        setSubmitTestError(null)
      } catch (error) {
        // The settings are saved; the test step explains what went wrong.
        logger.error('Failed to send the onboarding test', error)
        setSubmitTestError(
          isTestProviderUnavailable(error) ? 'unavailable' : toTestError(error)
        )
        void queryClient.invalidateQueries({
          queryKey: queryKeys.onboarding.test(),
        })
      }

      goToStep('test')
      return { ok: true, firstInvalidField: null }
    } finally {
      setIsSubmitting(false)
    }
  }, [canManage, form, goToStep, queryClient, setSubmitTestError, t])

  return {
    step,
    state,
    isLoading,
    loadErrorCode,
    retry: load,
    canManage,
    accountStatus: state?.standaloneSetup?.accountStatus ?? null,
    blockedReasons: state?.standaloneSetup?.blockedReasons ?? [],
    store: {
      form,
      fieldErrors,
      saveError,
      isSubmitting,
      setStoreName,
      setPhone,
      setPhoneCountry,
      setLanguage,
      setCurrency,
      setTimezone,
      submit: submitStore,
    },
    test: completion.test,
    completion: completion.completion,
  }
}

export type StandaloneOnboardingFlow = ReturnType<
  typeof useStandaloneOnboardingFlow
>
