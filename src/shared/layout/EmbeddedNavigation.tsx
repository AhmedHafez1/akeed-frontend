'use client'

/**
 * EmbeddedNavigation — Shopify Admin Sidebar Navigation
 *
 * In App Bridge v4, sidebar navigation is registered declaratively
 * via the `<ui-nav-menu>` web component placed in the rendered DOM.
 * Shopify reads the child `<a>` elements and surfaces them in the
 * Admin sidebar.
 *
 * This component renders the `<ui-nav-menu>` element with the
 * correct locale-aware hrefs.
 */

import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  appendEmbeddedParamsToPath,
  resolveEmbeddedContextFromSearch,
} from '@/shared/lib/embedded-context'
import { getLocaleFromPathname } from '@/shared/lib/locale'

export function EmbeddedNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')

  const resolvedContext = useMemo(
    () => resolveEmbeddedContextFromSearch(searchParams),
    [searchParams]
  )

  const dashboardHref = appendEmbeddedParamsToPath({
    path: `/${locale}/dashboard`,
    shopDomain: resolvedContext.shopDomain,
    hostParam: resolvedContext.hostParam,
  })

  const verificationsHref = appendEmbeddedParamsToPath({
    path: `/${locale}/verifications`,
    shopDomain: resolvedContext.shopDomain,
    hostParam: resolvedContext.hostParam,
  })

  const settingsHref = appendEmbeddedParamsToPath({
    path: `/${locale}/settings`,
    shopDomain: resolvedContext.shopDomain,
    hostParam: resolvedContext.hostParam,
  })

  return (
    <ui-nav-menu>
      <a href={dashboardHref} rel="home">
        Dashboard
      </a>
      <a href={verificationsHref}>Verifications</a>
      <a href={settingsHref}>Settings</a>
    </ui-nav-menu>
  )
}
