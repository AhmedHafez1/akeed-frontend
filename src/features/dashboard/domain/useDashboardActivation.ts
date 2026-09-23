'use client'

import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { activationStateOptions } from '../api/activationQueries'
import {
  buildActivationChecklist,
  isActivationComplete,
  resolveFreeMessagesLeft,
} from '../model/activation.model'

/**
 * First-run dashboard state and navigation: the activation checklist, whether
 * the store is live or needs a plan, free messages left, and links into
 * settings and back to the onboarding test.
 */
export function useDashboardActivation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activationQuery = useQuery(activationStateOptions())
  const state = activationQuery.data

  const locale = pathname?.split('/')[1] ?? 'ar'

  const navigate = useCallback(
    (path: string, params: Record<string, string> = {}) => {
      const search = new URLSearchParams(searchParams.toString())
      search.delete('tab')
      for (const [key, value] of Object.entries(params)) search.set(key, value)
      router.push(`/${locale}${path}?${search.toString()}`)
    },
    [locale, router, searchParams]
  )

  const checklist = useMemo(
    () => buildActivationChecklist(state?.activation),
    [state?.activation]
  )

  return {
    isLoaded: activationQuery.isSuccess,
    state,
    checklist,
    isComplete: isActivationComplete(state),
    isLive: state?.activation?.isLive ?? false,
    needsPlan: state?.activation?.needsPlan ?? false,
    freeMessagesLeft: resolveFreeMessagesLeft(state),
    openSettings: () => navigate('/settings', { tab: 'store' }),
    openQuietHours: () => navigate('/settings', { tab: 'confirmation' }),
    openTest: () => navigate('/onboarding', { step: 'test' }),
  }
}
