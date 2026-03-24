'use client'

import { resolveEmbeddedContextFromWindow } from '@/shared/lib/embedded-context'

const appBridgeApiKey =
  process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY || ''

/**
 * Loads Shopify App Bridge only when running in embedded mode.
 * This avoids blocking script execution for standalone pages.
 */
export function ShopifyAppBridgeScript() {
  const shouldLoad =
    typeof window !== 'undefined' &&
    resolveEmbeddedContextFromWindow().isEmbedded

  if (!appBridgeApiKey || !shouldLoad) {
    return null
  }

  return (
    <script
      id="shopify-app-bridge"
      src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
      data-api-key={appBridgeApiKey}
      async={false}
    />
  )
}
