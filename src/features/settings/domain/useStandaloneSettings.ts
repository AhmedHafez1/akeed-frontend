'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import { notify } from '@/shared/ui'
import {
  useSettingsModel,
  type SettingsModelAdapter,
  type SettingsModelMessages,
} from './useSettingsModel'

const standaloneAdapter: SettingsModelAdapter = {
  notifySuccess: (message) => notify.success({ message }),
  // A failed save is already shown in the page's banner.
  notifyError: (message, source) => {
    if (source === 'testSend') notify.error({ message })
  },
}

/**
 * State and actions for the standalone Settings page: the shared form model
 * (see `useSettingsModel`) reporting through toasts. It has no plan logic;
 * standalone accounts buy credits on the billing page.
 */
export function useStandaloneSettings() {
  const t = useTranslations('settings.standalone.messages')
  const { isLoading: isModeLoading } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  const messages = useMemo<SettingsModelMessages>(
    () => ({
      saveSuccess: t('saveSuccess'),
      saveInvalid: t('saveInvalid'),
      saveError: t('saveError'),
      readOnly: t('readOnly'),
      testSendSuccess: t('testSendSuccess'),
      testSendCooldown: t('testSendCooldown'),
      testSendDailyLimit: t('testSendDailyLimit'),
      testSendError: t('testSendError'),
    }),
    [t]
  )

  const model = useSettingsModel({
    enabled: !isModeLoading,
    messages,
    adapter: standaloneAdapter,
  })
  const onboardingStatus = model.data?.state.onboardingStatus

  useEffect(() => {
    if (onboardingStatus !== 'pending') return
    const search = typeof window !== 'undefined' ? window.location.search : ''
    router.replace(`/${locale}/onboarding${search}`)
  }, [locale, onboardingStatus, router])

  return model
}

export type StandaloneSettingsModel = ReturnType<typeof useStandaloneSettings>
