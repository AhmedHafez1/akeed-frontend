'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { useSettings } from '@/features/settings/domain/useSettings'
import { SettingsStandaloneSkin } from '@/features/settings/skins/standalone/SettingsStandaloneSkin'
import { SettingsEmbeddedTabbedSkin } from '@/features/settings/skins/embedded/SettingsEmbeddedTabbedSkin'
import { billingFixtureCounts } from '../billingFixture'

export default function BillingFixturePage() {
  const search = useSearchParams()
  const { skinProps, isPageLoading } = useSettings()
  const [counts, setCounts] = useState(billingFixtureCounts())
  const embedded = search.get('skin') === 'embedded'
  return (
    <AppProvider i18n={enTranslations}>
      <main style={{ padding: 24 }}>
        <h1>E02 isolated billing fixture — no provider network</h1>
        <p>
          Use entitlement=manual, shopify, blocked, or missing; skin=embedded or
          standalone.
        </p>
        <output aria-label="Billing fixture state">
          {JSON.stringify({
            ready: !isPageLoading,
            canManageBilling: skinProps.canManageBilling,
            selectedPlanId: skinProps.selectedPlanId,
            ...counts,
          })}
        </output>
        <button onClick={() => skinProps.onPlanSelect('pro')}>
          Select upgrade through hook
        </button>
        <button
          onClick={async () => {
            await skinProps.onChangePlan()
            setCounts(billingFixtureCounts())
          }}
        >
          Invoke billing handler
        </button>
        <button onClick={() => setCounts(billingFixtureCounts())}>
          Inspect billing calls
        </button>
        {!isPageLoading &&
          (embedded ? (
            <SettingsEmbeddedTabbedSkin {...skinProps} />
          ) : (
            <SettingsStandaloneSkin {...skinProps} />
          ))}
      </main>
    </AppProvider>
  )
}
