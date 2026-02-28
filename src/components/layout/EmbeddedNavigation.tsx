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

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname } from '@/lib/locale'

export function EmbeddedNavigation() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  return (
    <ui-nav-menu>
      <a href={`/${locale}/dashboard`} rel="home">
        Dashboard
      </a>
      <a href={`/${locale}/settings`}>Settings</a>
    </ui-nav-menu>
  )
}
