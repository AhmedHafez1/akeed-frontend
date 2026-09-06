'use client'

import { useEffect, useRef } from 'react'

const AWAITING_POLL_INTERVAL_MS = 30_000

/**
 * Re-reads a dashboard list when its rows may have changed server-side.
 *
 * Verification outcomes arrive over a WhatsApp webhook, not from anything the
 * merchant did in this tab, so a list that only refetches on filter changes
 * shows a confirmed order as still awaiting a reply until the page is reloaded.
 *
 * Refreshes when the tab regains focus, and polls slowly while at least one row
 * is still awaiting an outcome. A list of settled rows polls not at all.
 */
export function useOutcomeRefresh(
  refetch: () => void,
  hasAwaitingRows: boolean
) {
  const refetchRef = useRef(refetch)

  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refetchRef.current()
    }

    window.addEventListener('focus', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.removeEventListener('focus', refreshIfVisible)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [])

  useEffect(() => {
    if (!hasAwaitingRows) return

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refetchRef.current()
    }, AWAITING_POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [hasAwaitingRows])
}
