'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useShopifySubscribe } from '@/features/billing'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import {
  useSettingsModel,
  type SettingsModelAdapter,
  type SettingsModelMessages,
} from './useSettingsModel'

export type { SaveOutcome } from './useSettingsModel'

/**
 * State and actions for the embedded Settings page: the shared form model
 * (see `useSettingsModel`) plus what only Shopify Admin has, the App Bridge
 * toast and loading bar and the Plan tab's subscription.
 */
export function useEmbeddedSettings() {
  const t = useTranslations('settings.embedded')
  const { isLoading: isModeLoading, hostParam, shopify } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  const [isLoadingBarOn, setIsLoadingBarOn] = useState(true)
  useAppBridgeLoading(isLoadingBarOn)

  const messages = useMemo<SettingsModelMessages>(
    () => ({
      saveSuccess: t('saveSuccess'),
      saveInvalid: t('saveInvalid'),
      saveError: t('saveError'),
      readOnly: t('readOnly'),
      testSendSuccess: t('testSendSuccess'),
      testSendCooldown: t('testSendCooldown'),
      testSendDailyLimit: t('testSendDailyLimit'),
      testSendLanguageUnavailable: t('testSendLanguageUnavailable'),
      testSendError: t('testSendError'),
    }),
    [t]
  )
  const adapter = useMemo<SettingsModelAdapter>(
    () => ({
      notifySuccess: (message) => shopify?.toast.show(message),
      // A failed save is already shown in the page's banner.
      notifyError: (message, source) => {
        if (source === 'testSend') {
          shopify?.toast.show(message, { isError: true })
        }
      },
      onLoadingChange: setIsLoadingBarOn,
    }),
    [shopify]
  )

  const model = useSettingsModel({
    enabled: !isModeLoading,
    messages,
    adapter,
  })
  const { data, dirtyTabs: modelDirtyTabs } = model

  const planErrorMessage = useCallback(
    (failure: 'freePlanClaimed' | 'failed') =>
      t(
        failure === 'freePlanClaimed'
          ? 'plan.freePlanClaimedError'
          : 'plan.subscribeError'
      ),
    [t]
  )
  const plan = useShopifySubscribe(hostParam, {
    errorMessage: planErrorMessage,
  })

  useEffect(() => {
    if (data?.state.onboardingStatus !== 'pending') return
    const search = typeof window !== 'undefined' ? window.location.search : ''
    router.replace(`/${locale}/onboarding${search}`)
  }, [data?.state.onboardingStatus, locale, router])

  // The embedded app has no Store tab and no control for its field.
  const dirty = useMemo(() => {
    const tabs = new Set<'message' | 'timing'>()
    for (const tab of modelDirtyTabs) if (tab !== 'store') tabs.add(tab)
    return tabs
  }, [modelDirtyTabs])

  return {
    ...model,
    dirtyTabs: dirty,
    isDirty: dirty.size > 0,
    subscribingPlanId: plan.subscribingPlanId,
    planError: plan.error,
    dismissPlanError: plan.clearError,
    subscribe: plan.subscribe,
  }
}

export type EmbeddedSettingsModel = ReturnType<typeof useEmbeddedSettings>
