'use client'

/**
 * EmbeddedNavigation — Shopify Admin Sidebar Navigation
 *
 * Registers app navigation in the Shopify Admin sidebar using the
 * `<s-app-nav>` / `<s-link>` web components (App Bridge v4).
 *
 * Links use relative paths without `shop`/`host` query params —
 * App Bridge manages the embedded context automatically. Clicking
 * a sidebar link navigates within the iframe without a full page
 * reload, preserving the React tree and cached state.
 *
 * The embedded context (shop domain, host) is persisted in
 * sessionStorage on initial load, so it remains available even
 * when query params are absent from the URL.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library/web-components/ui-nav-menu
 */

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname } from '@/shared/lib/locale'

export function EmbeddedNavigation() {
  const t = useTranslations('embeddedSupport')
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  return (
    <s-app-nav>
      <s-link href={`/${locale}/dashboard`} rel="home">
        Dashboard
      </s-link>
      <s-link href={`/${locale}/settings`}>Settings</s-link>
      <s-link href={`/${locale}/support`}>{t('sidebarLabel')}</s-link>
    </s-app-nav>
  )
}
