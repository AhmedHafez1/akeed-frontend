'use client'

import { AppProvider } from '@shopify/polaris'
import polaris from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { SettingsEmbeddedPage } from '@/features/settings/skins/embedded/settings-page/SettingsEmbeddedPage'

/** Native settings over synthetic data; no Shopify Admin frame or session. */
export default function EmbeddedSettingsFixture() {
  return (
    <AppProvider i18n={polaris}>
      {/* App Bridge owns this chrome in Admin; this fixture has no Admin frame. */}
      <style>{'ui-save-bar { display: none; }'}</style>
      <div style={{ background: 'var(--p-color-bg)', minHeight: '100vh' }}>
        <SettingsEmbeddedPage />
      </div>
    </AppProvider>
  )
}
