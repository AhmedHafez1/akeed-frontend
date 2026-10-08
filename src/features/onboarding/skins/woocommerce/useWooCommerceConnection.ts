'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import {
  checkWooCommerceConnection,
  disconnectWooCommerce,
  enableWooCommerceWebhooks,
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
  type WooCommerceWebhookCleanup,
} from './wooCommerce.types'

const logger = createLogger('Onboarding')

/** While the store is posting its keys to Akeed after the merchant approved. */
export const WOOCOMMERCE_POLL_INTERVAL_MS = 4000

/** What the store adds to `return_url`; read once, then removed. */
const RETURN_PARAMS = ['success', 'user_id']

function errorCode(error: unknown): string {
  return error instanceof ApiError && error.code ? error.code : 'UNAVAILABLE'
}

/** What the last connection check found. */
export interface WooCommerceCheckResult {
  checkedAt: string
  problems: string[]
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
  /**
   * The same, for a disconnected source: the store is the one that was
   * connected, so there is no address to enter.
   */
  reconnect: () => Promise<void>
  /** Back to entering an address, keeping the one shown. */
  restart: () => void
  reload: () => Promise<void>
  isDisconnecting: boolean
  disconnectErrorCode: string | null
  /** Resolves true once the source is disconnected. */
  disconnect: () => Promise<boolean>
  clearDisconnectError: () => void
  /** Whether the store deleted Akeed's notifications at the last disconnect. */
  webhookCleanup: WooCommerceWebhookCleanup | null
  isChecking: boolean
  checkResult: WooCommerceCheckResult | null
  /** Why the check itself could not run. */
  checkErrorCode: string | null
  check: () => Promise<void>
  isEnabling: boolean
  enableErrorCode: string | null
  /** True right after a re-enable the store confirmed. */
  webhooksEnabled: boolean
  enableWebhooks: () => Promise<boolean>
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
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [disconnectErrorCode, setDisconnectErrorCode] = useState<string | null>(
    null
  )
  const [webhookCleanup, setWebhookCleanup] =
    useState<WooCommerceWebhookCleanup | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<WooCommerceCheckResult | null>(
    null
  )
  const [checkErrorCode, setCheckErrorCode] = useState<string | null>(null)
  const [isEnabling, setIsEnabling] = useState(false)
  const [enableErrorCode, setEnableErrorCode] = useState<string | null>(null)
  const [webhooksEnabled, setWebhooksEnabled] = useState(false)
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

  const reconnectStoreUrl = status?.connection?.storeUrl ?? null
  const reconnect = useCallback(async () => {
    if (reconnectStoreUrl) await connect(reconnectStoreUrl)
  }, [connect, reconnectStoreUrl])

  const restart = useCallback(() => {
    setRestarting(true)
    setReturnHint(null)
    setStartErrorCode(null)
  }, [])

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true)
    setDisconnectErrorCode(null)
    try {
      const { webhookCleanup: cleanup, ...next } = await disconnectWooCommerce()
      if (!activeRef.current) return true
      setStatus(next)
      setWebhookCleanup(cleanup)
      setCheckResult(null)
      setCheckErrorCode(null)
      setEnableErrorCode(null)
      setWebhooksEnabled(false)
      setRestarting(false)
      setReturnHint(null)
      return true
    } catch (error) {
      logger.error('Failed to disconnect WooCommerce', errorCode(error))
      if (activeRef.current) setDisconnectErrorCode(errorCode(error))
      return false
    } finally {
      if (activeRef.current) setIsDisconnecting(false)
    }
  }, [])

  const clearDisconnectError = useCallback(
    () => setDisconnectErrorCode(null),
    []
  )

  const check = useCallback(async () => {
    setIsChecking(true)
    setCheckErrorCode(null)
    setWebhooksEnabled(false)
    try {
      const result = await checkWooCommerceConnection()
      if (!activeRef.current) return
      setStatus(result.status)
      setCheckResult({
        checkedAt: result.checkedAt,
        problems: result.problems,
      })
    } catch (error) {
      logger.error(
        'Failed to check the WooCommerce connection',
        errorCode(error)
      )
      if (activeRef.current) {
        setCheckResult(null)
        setCheckErrorCode(errorCode(error))
      }
    } finally {
      if (activeRef.current) setIsChecking(false)
    }
  }, [])

  const enableWebhooks = useCallback(async () => {
    setIsEnabling(true)
    setEnableErrorCode(null)
    setWebhooksEnabled(false)
    try {
      const next = await enableWooCommerceWebhooks()
      if (!activeRef.current) return true
      setStatus(next)
      // What the last check found no longer describes the store.
      setCheckResult(null)
      setWebhooksEnabled(true)
      return true
    } catch (error) {
      logger.error(
        'Failed to re-enable the WooCommerce notifications',
        errorCode(error)
      )
      if (activeRef.current) setEnableErrorCode(errorCode(error))
      return false
    } finally {
      if (activeRef.current) setIsEnabling(false)
    }
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
    reconnect,
    restart,
    reload,
    isDisconnecting,
    disconnectErrorCode,
    disconnect,
    clearDisconnectError,
    webhookCleanup,
    isChecking,
    checkResult,
    checkErrorCode,
    check,
    isEnabling,
    enableErrorCode,
    webhooksEnabled,
    enableWebhooks,
  }
}
