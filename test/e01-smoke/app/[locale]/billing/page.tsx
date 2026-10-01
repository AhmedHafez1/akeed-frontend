'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { useQuery } from '@tanstack/react-query'
import { fetchSettings } from '@/features/settings/api/settingsApi'
import { SettingsEmbeddedPage } from '@/features/settings/skins/embedded/settings-page/SettingsEmbeddedPage'
import { SettingsStandalonePage } from '@/features/settings/skins/standalone/settings-page/SettingsStandalonePage'
import { queryKeys } from '@/shared/query/keys'
import { billingFixtureCounts } from '../billingFixture'

export default function BillingFixturePage() {
  const search = useSearchParams()
  // The same cache entry both Settings pages read; no extra request.
  const { data } = useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: fetchSettings,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
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
            ready: data !== undefined,
            canManageBilling:
              data?.state.billingManagement?.canManageBilling ?? false,
            billingPlanId: data?.state.billingPlanId ?? null,
            ...counts,
          })}
        </output>
        <button onClick={() => setCounts(billingFixtureCounts())}>
          Inspect billing calls
        </button>
        {embedded ? <SettingsEmbeddedPage /> : <SettingsStandalonePage />}
      </main>
    </AppProvider>
  )
}
