'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ClientApplication } from '@shopify/app-bridge'

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
 */

export type AkeedMode = 'EMBEDDED' | 'STANDALONE'

export interface AkeedModeContext {
  mode: AkeedMode
  isEmbedded: boolean
  isStandalone: boolean
  shopDomain: string | null
  hostParam: string | null
  appBridge: ClientApplication | null
  isLoading: boolean
}

/**
 * Core hook for runtime mode detection
 */
export function useAkeedMode(): AkeedModeContext {
  const searchParams = useSearchParams()
  const [appBridge, setAppBridge] = useState<ClientApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Extract Shopify-specific URL parameters
  const shopDomain = searchParams.get('shop')
  const hostParam = searchParams.get('host')

  // Determine mode based on URL parameters
  const mode: AkeedMode = useMemo(() => {
    return shopDomain && hostParam ? 'EMBEDDED' : 'STANDALONE'
  }, [shopDomain, hostParam])

  const isEmbedded = mode === 'EMBEDDED'
  const isStandalone = mode === 'STANDALONE'

  // Initialize Shopify App Bridge if in embedded mode
  useEffect(() => {
    if (!isEmbedded) {
      setIsLoading(false)
      return
    }

    // Dynamic import to avoid loading Shopify App Bridge in standalone mode
    let mounted = true

    const initializeAppBridge = async () => {
      try {
        // Load Shopify App Bridge
        const createApp = await import('@shopify/app-bridge').then(
          (module) => module.default || module.createApp
        )

        if (!mounted) return

        // Initialize App Bridge
        const app = createApp({
          apiKey: process.env.SHOPIFY_API_KEY!,
          host: hostParam!,
          forceRedirect: true,
        })

        // Store App Bridge instance
        setAppBridge(app)
        setIsLoading(false)

        console.log('[Akeed] Initialized in EMBEDDED mode', {
          shop: shopDomain,
          host: hostParam,
        })
      } catch (error) {
        console.error('[Akeed] Failed to initialize App Bridge:', error)
        setIsLoading(false)
      }
    }

    initializeAppBridge()

    return () => {
      mounted = false
    }
  }, [isEmbedded, shopDomain, hostParam])

  // Log mode detection for debugging
  useEffect(() => {
    if (!isLoading) {
      console.log('[Akeed] Mode detected:', {
        mode,
        shop: shopDomain,
        host: hostParam,
      })
    }
  }, [mode, shopDomain, hostParam, isLoading])

  return {
    mode,
    isEmbedded,
    isStandalone,
    shopDomain,
    hostParam,
    appBridge,
    isLoading,
  }
}

/**
 * Helper hook to get session token for API requests
 * Only works in embedded mode
 */
export function useShopifySessionToken() {
  const { appBridge, isEmbedded } = useAkeedMode()

  const getSessionToken = async (): Promise<string | null> => {
    if (!isEmbedded || !appBridge) {
      return null
    }

    try {
      // Use App Bridge to get session token
      const getSessionToken =
        await import('@shopify/app-bridge/utilities').then(
          (module) => module.getSessionToken
        )

      const token = await getSessionToken(appBridge as ClientApplication)
      return token
    } catch (error) {
      console.error('[Akeed] Failed to get session token:', error)
      return null
    }
  }

  return { getSessionToken }
}
