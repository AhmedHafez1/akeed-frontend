'use client'

import { useSearchParams } from 'next/navigation'
import { resolveEmbeddedContextFromSearch } from '@/shared/lib/embedded-context'
import { Suspense } from 'react'

const appBridgeApiKey =
  process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY || ''

function ShopifyAppBridgeScriptInner() {
  const searchParams = useSearchParams()
  const isEmbedded = resolveEmbeddedContextFromSearch(searchParams).isEmbedded

  if (!appBridgeApiKey || !isEmbedded) {
    return null
  }

  return (
    <script
      id="shopify-app-bridge"
      src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
      data-api-key={appBridgeApiKey}
    />
  )
}

/**
 * Loads Shopify App Bridge only when running in embedded mode.
 * This avoids blocking script execution for standalone pages.
 */
export function ShopifyAppBridgeScript() {
  return (
    <Suspense fallback={null}>
      <ShopifyAppBridgeScriptInner />
    </Suspense>
  )
}
