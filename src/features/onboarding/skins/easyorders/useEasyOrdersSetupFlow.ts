'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import {
  fetchOnboardingState,
  OnboardingApiError,
  sendOnboardingTest,
  updateOnboardingSettings,
} from '@/features/onboarding/api/onboardingApi'
import type {
  IntegrationOnboardingState,
  SetupBlockedReason,
  StandaloneStep,
} from '@/features/onboarding/domain/onboarding.types'
import {
  isTestProviderUnavailable,
  toTestError,
} from '@/features/onboarding/hooks/useOnboardingTest'
import { useOnboardingTestCompletion } from '@/features/onboarding/hooks/useOnboardingTestCompletion'
import {
  countryFromLanguages,
  countryFromPhone,
  parseStandaloneStep,
  validateStoreForm,
} from '@/features/onboarding/model/standaloneStore'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { createLogger } from '@/shared/lib/logger'
import { queryKeys } from '@/shared/query/keys'
import type { PhoneCountry } from '@/shared/ui/international-phone-input'
import {
  buildEasyOrdersChecklist,
  type EasyOrdersChecklistItem,
  type EasyOrdersConnectionDetails,
} from './easyOrders.types'

const logger = createLogger('Onboarding')

function urlWithStep(step: StandaloneStep) {
  const url = new URL(window.location.href)
  url.searchParams.set('step', step)
  return `${url.pathname}${url.search}${url.hash}`
}

function browserCountry(): PhoneCountry {
  if (typeof navigator === 'undefined') return countryFromLanguages([])
  return countryFromLanguages(
    navigator.languages?.length ? navigator.languages : [navigator.language]
  )
}

/** The test step needs a saved number and nothing blocking the finish. */
function resolveStep(
  state: IntegrationOnboardingState,
  blockedReasons: readonly SetupBlockedReason[],
  requested: StandaloneStep | null
): StandaloneStep {
  return requested === 'test' &&
    state.merchantWhatsappPhone &&
    blockedReasons.length === 0
    ? 'test'
    : 'store'
}

/**
 * Finishing setup for a connected EasyOrders store: a checklist of what the
 * connection still needs, then the same free test and `/complete` every
 * other source uses. Steps live in `?step=` under the common names, so the
 * shell's stepper follows without knowing the source.
 */
export function useEasyOrdersSetupFlow(
  connection: EasyOrdersConnectionDetails | null,
  enabled: boolean
) {
  const t = useTranslations('standaloneOnboarding')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const locale = getLocaleFromPathname(pathname ?? '')

  const [state, setState] = useState<IntegrationOnboardingState | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [phone, setPhoneValue] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(browserCountry)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  /** Reasons a blocked /complete answered with, until the state is re-read. */
  const [completeBlockers, setCompleteBlockers] = useState<
    SetupBlockedReason[] | null
  >(null)

  // The setup inputs live on the connection; when one changes, what blocks
  // the finish changes with it.
  const connectionKey = connection
    ? [
        connection.currency,
        connection.phoneCountry,
        connection.ordersSecretSet,
        connection.statusSecretSet,
        connection.health,
      ].join('|')
    : null

  const load = useCallback(async () => {
    setLoadFailed(false)
    try {
      const response = await fetchOnboardingState()
      setState(response.state)
      setCompleteBlockers(null)
      const saved = response.state.merchantWhatsappPhone
      if (saved) {
        setPhoneValue((current) => current || saved)
        const country = countryFromPhone(saved)
        if (country) setPhoneCountry(country)
      }
    } catch (error) {
      logger.error('Failed to load EasyOrders setup', error)
      setLoadFailed(true)
    }
  }, [])

  useEffect(() => {
    if (!enabled || connectionKey === null) return
    void load()
  }, [connectionKey, enabled, load])

  const blockedReasons: readonly SetupBlockedReason[] =
    completeBlockers ?? state?.sourceSetup?.blockedReasons ?? []
  const requestedStep = parseStandaloneStep(searchParams?.get('step'))
  const dashboardPath = `/${locale}/dashboard`

  const goToStep = useCallback((next: StandaloneStep) => {
    window.history.pushState(null, '', urlWithStep(next))
  }, [])
  const backToChecklist = useCallback(() => goToStep('store'), [goToStep])
  const doneUrl = useCallback(() => urlWithStep('done'), [])
  const showBlockedReasons = useCallback(
    (reasons: SetupBlockedReason[]) => {
      setCompleteBlockers(reasons)
      goToStep('store')
    },
    [goToStep]
  )
  const readOnlyMessage = t('readOnly')
  const completeErrorMessage = t('completeError')

  const completion = useOnboardingTestCompletion({
    isTestStep:
      enabled &&
      !!state &&
      resolveStep(state, blockedReasons, requestedStep) === 'test',
    dashboardPath,
    doneUrl,
    messages: {
      readOnly: readOnlyMessage,
      completeError: completeErrorMessage,
    },
    onCompleted: setState,
    onBlocked: showBlockedReasons,
    onChangeNumber: backToChecklist,
  })
  const { setSubmitTestError } = completion

  const step: StandaloneStep = completion.isDone
    ? 'done'
    : state
      ? resolveStep(state, blockedReasons, requestedStep)
      : 'store'

  // Keep the URL naming the step actually shown.
  useEffect(() => {
    if (!enabled || !state || requestedStep === step) return
    window.history.replaceState(null, '', urlWithStep(step))
  }, [enabled, requestedStep, state, step])

  const setPhone = useCallback((value: string) => {
    setPhoneValue(value)
    setPhoneError(null)
    const country = value && countryFromPhone(value)
    if (country) setPhoneCountry(country)
  }, [])

  const canManage = state?.permissions.canUpdateConfiguration === true
  const checklist: EasyOrdersChecklistItem[] = connection
    ? buildEasyOrdersChecklist(
        connection,
        state?.sourceSetup?.sender.status ?? 'unknown'
      )
    : []
  const isReady =
    !!state &&
    checklist.every((item) => item.done) &&
    blockedReasons.length === 0

  /** Saves the number, sends the free test and opens the test step. */
  const startTest = useCallback(async (): Promise<boolean> => {
    if (!state || !canManage || !isReady) return false
    setSaveError(null)
    const storeName = state.storeName?.trim() ?? ''
    const invalid = validateStoreForm(
      {
        storeName: storeName || '-',
        phone,
        phoneCountry,
        language: state.defaultLanguage,
        currency: 'EGP',
        timezone: 'Africa/Cairo',
      },
      {
        storeNameRequired: '',
        phoneInvalid: (hint) => t('store.validation.phone', { ...hint }),
      }
    ).merchantWhatsappPhone
    if (invalid) {
      setPhoneError(invalid)
      return false
    }

    setIsSubmitting(true)
    try {
      try {
        const saved = await updateOnboardingSettings({
          storeName,
          defaultLanguage: state.defaultLanguage,
          isAutoVerifyEnabled: state.isAutoVerifyEnabled,
          merchantWhatsappPhone: phone,
        })
        setState(saved.state)
      } catch (error) {
        logger.error('Failed to save the EasyOrders test number', error)
        setSaveError(
          error instanceof OnboardingApiError && error.status === 403
            ? t('readOnly')
            : t('store.saveError')
        )
        return false
      }

      try {
        const test = await sendOnboardingTest({ resend: false })
        queryClient.setQueryData(queryKeys.onboarding.test(), test)
        setSubmitTestError(null)
      } catch (error) {
        // The number is saved; the test step explains what went wrong.
        logger.error('Failed to send the onboarding test', error)
        setSubmitTestError(
          isTestProviderUnavailable(error) ? 'unavailable' : toTestError(error)
        )
        void queryClient.invalidateQueries({
          queryKey: queryKeys.onboarding.test(),
        })
      }

      goToStep('test')
      return true
    } finally {
      setIsSubmitting(false)
    }
  }, [
    canManage,
    goToStep,
    isReady,
    phone,
    phoneCountry,
    queryClient,
    setSubmitTestError,
    state,
    t,
  ])

  return {
    step,
    state,
    loadFailed,
    retry: load,
    canManage,
    checklist,
    blockedReasons,
    isReady,
    dashboardPath,
    phone: {
      value: phone,
      country: phoneCountry,
      error: phoneError,
      set: setPhone,
      setCountry: setPhoneCountry,
    },
    saveError,
    isSubmitting,
    startTest,
    test: completion.test,
    completion: completion.completion,
  }
}

export type EasyOrdersSetupFlow = ReturnType<typeof useEasyOrdersSetupFlow>
