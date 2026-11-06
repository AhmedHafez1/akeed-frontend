'use client'

import { AppProvider, Page } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { WhatsappTab } from '@/features/settings/skins/embedded/settings-page/WhatsappTab'

/*
 * The embedded (Shopify) WhatsApp settings tab in Polaris, over the
 * synthetic sender in whatsappSenderFixture.ts. `?wa=` and `role=` pick the
 * scenario. This is Polaris on its own, not the Shopify Admin frame.
 */
export default function WhatsappTabFixturePage() {
  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ background: 'var(--p-color-bg)', minHeight: '100vh' }}>
        <Page title="Settings">
          <WhatsappTab
            pools={{
              akeed: { used: 138, limit: 300, remaining: 162 },
              ownNumber: { used: 360, limit: 900, remaining: 540 },
            }}
          />
        </Page>
      </div>
    </AppProvider>
  )
}
