'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ClientApplication } from '@shopify/app-bridge'

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

  const shopDomain = searchParams.get('shop')
  const hostParam = searchParams.get('host')

  const mode: AkeedMode = useMemo(() => {
    return shopDomain && hostParam ? 'EMBEDDED' : 'STANDALONE'
  }, [shopDomain, hostParam])

  const isEmbedded = mode === 'EMBEDDED'
  const isStandalone = mode === 'STANDALONE'

  useEffect(() => {
    if (!isEmbedded) {
      setIsLoading(false)
      return
    }

    let mounted = true

    const initializeAppBridge = async () => {
      try {
        const createApp = await import('@shopify/app-bridge').then(
          (module) => module.default || module.createApp
        )

        if (!mounted) return

        const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY

        if (!apiKey) {
          console.error('[Akeed] NEXT_PUBLIC_SHOPIFY_API_KEY is not defined')
          setIsLoading(false)
          return
        }

        const app = createApp({
          apiKey,
          host: hostParam!,
          forceRedirect: true,
        })

        // Store globally for auth module access
        window.__SHOPIFY_APP_BRIDGE__ = app

        setAppBridge(app)
        setIsLoading(false)
      } catch (error) {
        console.error('[Akeed] Failed to initialize App Bridge:', error)
        setIsLoading(false)
      }
    }

    initializeAppBridge()

    return () => {
      mounted = false
    }
  }, [isEmbedded, hostParam])

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
