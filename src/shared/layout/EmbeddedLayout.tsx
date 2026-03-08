'use client'

import type { ReactNode } from 'react'
import { AppProvider, Frame } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
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

interface EmbeddedLayoutProps {
  children: ReactNode
}

export function EmbeddedLayout({ children }: EmbeddedLayoutProps) {
  return (
    <AppProvider i18n={enTranslations}>
      <Frame>
        {/* Register Shopify sidebar nav links (renders nothing) */}
        <EmbeddedNavigation />

        {/* Page content rendered by skins (e.g. DashboardEmbeddedSkin) */}
        {children}
      </Frame>
    </AppProvider>
  )
}
