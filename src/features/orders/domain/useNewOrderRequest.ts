'use client'

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/** `?new-order=1` opens the manual order dialog once (onboarding's "Add your first order"). */
export const NEW_ORDER_PARAM = 'new-order'

/**
 * A link's request to open the manual order dialog on arrival.
 *
 * Whichever manual order action is on screen (the top bar, or the first-run
 * card while the top bar hides its actions) honours it once, then removes the
 * param. A request the gate cannot honour (no credits, no source) is dropped
 * as soon as the gate is known, so a refresh never retries it.
 */
export function useNewOrderRequest({
  isGateKnown,
  canOpen,
}: {
  isGateKnown: boolean
  canOpen: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isRequested = searchParams?.get(NEW_ORDER_PARAM) === '1'

  const clear = useCallback(() => {
    const next = new URLSearchParams(searchParams?.toString())
    next.delete(NEW_ORDER_PARAM)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : (pathname ?? '/'), {
      scroll: false,
    })
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (isRequested && isGateKnown && !canOpen) clear()
  }, [canOpen, clear, isGateKnown, isRequested])

  return {
    shouldAutoOpen: isRequested && canOpen,
    onAutoOpened: clear,
  }
}
