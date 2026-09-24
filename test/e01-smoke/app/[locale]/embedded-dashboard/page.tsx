'use client'

import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { MainEmbeddedSkin } from '@/features/dashboard/skins/embedded/MainEmbeddedSkin'

/**
 * The production embedded dashboard and confirmations tabs over the synthetic
 * backend in `embeddedDashboardFixture.ts`. Use `?tab=confirmations` and the
 * scenarios listed there.
 */
export default function EmbeddedDashboardFixturePage() {
  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ background: 'var(--p-color-bg)', minHeight: '100vh' }}>
        <MainEmbeddedSkin />
      </div>
    </AppProvider>
  )
}
