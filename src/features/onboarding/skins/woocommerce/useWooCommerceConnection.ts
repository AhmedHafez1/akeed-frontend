'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import {
  fetchWooCommerceConnection,
  startWooCommerceInstall,
} from './wooCommerceApi'
import { openStoreAuthorization } from './wooCommerceNavigation'
import {
  parseWooCommerceReturnHint,
  resolveWooCommerceConnectView,
  type WooCommerceConnectionStatus,
  type WooCommerceConnectView,
  type WooCommerceReturnHint,
} from './wooCommerce.types'

const logger = createLogger('Onboarding')

/** While the store is posting its keys to Akeed after the merchant approved. */
export const WOOCOMMERCE_POLL_INTERVAL_MS = 4000

/** What the store adds to `return_url`; read once, then removed. */
const RETURN_PARAMS = ['success', 'user_id']

function errorCode(error: unknown): string {
  return error instanceof ApiError && error.code ? error.code : 'UNAVAILABLE'
}

export interface WooCommerceConnectionController {
  view: WooCommerceConnectView
  status: WooCommerceConnectionStatus | null
  canManage: boolean
  isStarting: boolean
  /** Why the last "Continue" was refused before the store was opened. */
  startErrorCode: string | null
  /** Sends the merchant to the store's approval page, in this tab. */
  connect: (storeUrl: string) => Promise<void>
  /** Back to entering an address, keeping the one shown. */
  restart: () => void
  reload: () => Promise<void>
}

/**
 * The WooCommerce connection for the signed-in organization.
 *
 * The store sends the merchant back here with `success` in the address, and
 * posts the keys to Akeed separately. The redirect is only a hint: `success=1`
 * shows the waiting state while this page polls Akeed's own status, and
 * `success=0` shows the denied state. Neither changes anything.
 */
export function useWooCommerceConnection(
  locale: 'ar' | 'en'
): WooCommerceConnectionController {
  const [status, setStatus] = useState<WooCommerceConnectionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [returnHint, setReturnHint] = useState<WooCommerceReturnHint>(null)
  const [restarting, setRestarting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [startErrorCode, setStartErrorCode] = useState<string | null>(null)
  const activeRef = useRef(true)

  const reload = useCallback(async () => {
    try {
      const next = await fetchWooCommerceConnection()
      if (!activeRef.current) return
      setStatus(next)
      setLoadFailed(false)
    } catch (error) {
      logger.error(
        'Failed to load the WooCommerce connection',
        errorCode(error)
      )
      if (activeRef.current) setLoadFailed(true)
    } finally {
      if (activeRef.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    activeRef.current = true
    void reload()
    return () => {
      activeRef.current = false
    }
  }, [reload])

  // Read after mount, so the server render and the first client render match.
  useEffect(() => {
    const url = new URL(window.location.href)
    setReturnHint(parseWooCommerceReturnHint(url.search))
    if (!RETURN_PARAMS.some((name) => url.searchParams.has(name))) return
    for (const name of RETURN_PARAMS) url.searchParams.delete(name)
    window.history.replaceState(window.history.state, '', url.toString())
  }, [])

  const isPending = status?.state === 'pending'
  useEffect(() => {
    if (!isPending) return
    const timer = window.setInterval(
      () => void reload(),
      WOOCOMMERCE_POLL_INTERVAL_MS
    )
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [isPending, reload])

  const connect = useCallback(
    async (storeUrl: string) => {
      setIsStarting(true)
      setStartErrorCode(null)
      try {
        const started = await startWooCommerceInstall(storeUrl, locale)
        openStoreAuthorization(started.authorizeUrl)
      } catch (error) {
        logger.error(
          'Failed to start the WooCommerce install',
          errorCode(error)
        )
        if (activeRef.current) {
          setStartErrorCode(errorCode(error))
          setIsStarting(false)
        }
      }
    },
    [locale]
  )

  const restart = useCallback(() => {
    setRestarting(true)
    setReturnHint(null)
    setStartErrorCode(null)
  }, [])

  return {
    view: resolveWooCommerceConnectView(status, {
      isLoading,
      loadFailed,
      returnHint,
      restarting,
    }),
    status,
    canManage: status?.canManage ?? false,
    isStarting,
    startErrorCode,
    connect,
    restart,
    reload,
  }
}
