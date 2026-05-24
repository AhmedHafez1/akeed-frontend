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

function getStandaloneSupportUrl(locale: string): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const appOrigin =
    configuredAppUrl && configuredAppUrl.length > 0
      ? configuredAppUrl.replace(/\/$/, '')
      : window.location.origin

  return `${appOrigin}/${locale}/support`
}

export function EmbeddedNavigation() {
  const appHeader = useTranslations('appHeader')
  const t = useTranslations('embeddedSupport')
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const supportUrl = getStandaloneSupportUrl(locale)

  return (
    <s-app-nav>
      <s-link href={`/${locale}/dashboard`} rel="home">
        {appHeader('dashboard')}
      </s-link>
      <s-link href={`/${locale}/settings`}>{appHeader('settings')}</s-link>
      <s-link
        href={supportUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('sidebarLabel')}
      </s-link>
    </s-app-nav>
  )
}
