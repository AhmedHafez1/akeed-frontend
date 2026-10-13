'use client'

import type { ReactNode } from 'react'
import { AppProvider, Frame } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import esTranslations from '@shopify/polaris/locales/es.json'
import frTranslations from '@shopify/polaris/locales/fr.json'
import '@shopify/polaris/build/esm/styles.css'
import { usePathname } from 'next/navigation'
import {
  getLocaleFromPathname,
  type SupportedLocale,
} from '@/shared/lib/locale'
import { EmbeddedLanguageSelector } from './EmbeddedLanguageSelector'
import { EmbeddedNavigation } from './EmbeddedNavigation'

/**
 * EmbeddedLayout — Shopify Polaris Integration
 *
 * Production layout for embedded mode (Shopify Admin iframe).
 *
 * Responsibilities:
 *  - Wraps children in Polaris `AppProvider` with i18n translations
 *  - Imports Polaris CSS (scoped to embedded mode — never leaks to standalone)
 *  - Renders Polaris `Frame` for proper layout structure
 *  - Registers Shopify Admin sidebar navigation via `EmbeddedNavigation`
 *
 * Note: Shopify Admin chrome provides the header and sidebar chrome.
 * We only register navigation links — Shopify renders them.
 */

/**
 * Polaris's own labels (pagination, "Loading", "Clear"). It ships no Arabic or
 * Urdu file, so those languages read its English ones.
 */
const POLARIS_TRANSLATIONS: Partial<
  Record<SupportedLocale, typeof enTranslations>
> = {
  es: esTranslations,
  fr: frTranslations,
}

interface EmbeddedLayoutProps {
  children: ReactNode
}

export function EmbeddedLayout({ children }: EmbeddedLayoutProps) {
  const locale = getLocaleFromPathname(usePathname() ?? '/')

  return (
    <AppProvider i18n={POLARIS_TRANSLATIONS[locale] ?? enTranslations}>
      <Frame>
        {/* Register Shopify sidebar nav links (renders nothing) */}
        <EmbeddedNavigation />

        {/* Register native Shopify App Bridge title bar locale actions. */}
        <EmbeddedLanguageSelector />

        {/* Page content rendered by skins (e.g. DashboardEmbeddedSkin) */}
        <div className="akeed-embedded-content">{children}</div>
      </Frame>
    </AppProvider>
  )
}
