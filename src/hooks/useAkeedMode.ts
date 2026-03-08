'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { resolveEmbeddedContextFromSearch } from '@/shared/lib/embedded-context'
import type { ShopifyGlobal } from '@/types/window.model'

/**
 * Akeed Runtime Mode Detection
 *
 * This hook detects whether the app is running in:
 * - EMBEDDED mode (inside Shopify Admin iframe)
 * - STANDALONE mode (SaaS portal)
 *
 * Detection is based on URL parameters:
 * - Presence of 'shop' and 'host' params = EMBEDDED
 * - Absence of these params = STANDALONE
 *
 * In App Bridge v4, the Shopify CDN script exposes `window.shopify`
 * automatically when the app runs inside Shopify Admin. There is
 * no `createApp()` call or npm package required.
 */

export type AkeedMode = 'EMBEDDED' | 'STANDALONE'

export interface AkeedModeContext {
  mode: AkeedMode
  isEmbedded: boolean
  isStandalone: boolean
  shopDomain: string | null
  hostParam: string | null
  shopify: ShopifyGlobal | null
  isLoading: boolean
}

/**
 * Polls for `window.shopify` to become available.
 * The CDN script initialises asynchronously, so it may not exist on
 * the very first render tick.
 */
function waitForShopifyGlobal(
  signal: AbortSignal,
  timeoutMs = 3000,
  intervalMs = 50
): Promise<ShopifyGlobal | null> {
  return new Promise((resolve) => {
    if (window?.shopify) {
      resolve(window.shopify)
      return
    }

    const start = Date.now()

    const check = () => {
      if (signal.aborted) {
        resolve(null)
        return
      }

      if (window?.shopify) {
        resolve(window.shopify)
        return
      }

      if (Date.now() - start >= timeoutMs) {
        resolve(null)
        return
      }

      setTimeout(check, intervalMs)
    }

    check()
  })
}

/** Internal state for the resolved App Bridge instance + readiness. */
interface ResolvedState {
  shopify: ShopifyGlobal | null
  ready: boolean
}

const INITIAL_STATE: ResolvedState = { shopify: null, ready: false }
const STANDALONE_STATE: ResolvedState = { shopify: null, ready: true }

/**
 * Core hook for runtime mode detection
 */
export function useAkeedMode(): AkeedModeContext {
  const searchParams = useSearchParams()
  const resolvedContext = useMemo(
    () => resolveEmbeddedContextFromSearch(searchParams),
    [searchParams]
  )

  const { shopDomain, hostParam, isEmbedded } = resolvedContext

  const mode: AkeedMode = useMemo(() => {
    return isEmbedded ? 'EMBEDDED' : 'STANDALONE'
  }, [isEmbedded])

  const isStandalone = mode === 'STANDALONE'

  // Track async App Bridge resolution for embedded mode only.
  const [embeddedResolved, setEmbeddedResolved] =
    useState<ResolvedState>(INITIAL_STATE)

  const markReady = useCallback(
    (instance: ShopifyGlobal | null) =>
      setEmbeddedResolved({ shopify: instance, ready: true }),
    []
  )

  useEffect(() => {
    if (!isEmbedded) return

    const controller = new AbortController()

    waitForShopifyGlobal(controller.signal)
      .then((instance) => {
        if (controller.signal.aborted) return

        if (!instance) {
          console.error(
            '[Akeed] window.shopify not available — is the App Bridge CDN script loaded?'
          )
        }

        markReady(instance)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          markReady(null)
        }
      })

    return () => {
      controller.abort()
    }
  }, [isEmbedded, markReady])

  // Derive final state: standalone is always ready; embedded waits for resolution.
  const resolved = isEmbedded ? embeddedResolved : STANDALONE_STATE

  return {
    mode,
    isEmbedded,
    isStandalone,
    shopDomain,
    hostParam,
    shopify: resolved.shopify,
    isLoading: !resolved.ready,
  }
}
