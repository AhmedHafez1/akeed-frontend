'use client'

import { useEffect } from 'react'
import { useAkeedMode } from './useAkeedMode'

/**
 * Triggers the native Shopify Admin top-level progress bar
 * via App Bridge v4's `shopify.loading()` API.
 *
 * Call with `true` when a route transition or heavy data fetch starts,
 * and `false` when it completes. In standalone mode this is a no-op.
 */
export function useAppBridgeLoading(isLoading: boolean) {
  const { shopify } = useAkeedMode()

  useEffect(() => {
    if (!shopify) return
    shopify.loading(isLoading)
    return () => {
      shopify.loading(false)
    }
  }, [shopify, isLoading])
}
