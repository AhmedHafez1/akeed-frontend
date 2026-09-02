'use client'

import { useState } from 'react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { useDashboard } from '@/features/dashboard/domain/useDashboard'
import { useMainConfirmationsTab } from '@/features/dashboard/domain/useMainConfirmationsTab'
import { VerificationsTableEmbedded } from '@/features/dashboard/skins/embedded/VerificationsTableEmbedded'
import { VerificationsTableStandalone } from '@/features/dashboard/skins/standalone/VerificationsTableStandalone'
import {
  fixtureCounts,
  setFixtureResult,
  settleFixture,
  setFixtureCapability,
} from './fixtureApi'

function StandaloneFixture() {
  const dashboard = useDashboard()
  return <VerificationsTableStandalone {...dashboard} />
}

function EmbeddedFixture() {
  const confirmations = useMainConfirmationsTab('last_30_days')
  return <VerificationsTableEmbedded {...confirmations} />
}

export default function SmokePage() {
  const [skin, setSkin] = useState('embedded')
  const [capability, setCapability] = useState('supported')
  const [counts, setCounts] = useState(fixtureCounts())
  const Fixture = skin === 'embedded' ? EmbeddedFixture : StandaloneFixture
  return (
    <AppProvider i18n={enTranslations}>
      <main style={{ padding: 24 }}>
        <h1>E01 isolated cancellation fixture — no provider network</h1>
        <p>
          Authentication and full layouts are checked separately in the real
          apps.
        </p>
        <label>
          Fixture skin{' '}
          <select
            value={skin}
            onChange={(event) => setSkin(event.target.value)}
          >
            <option value="embedded">Embedded</option>
            <option value="standalone">Standalone</option>
          </select>
        </label>
        <label>
          Fixture result{' '}
          <select
            defaultValue="failure"
            onChange={(event) =>
              setFixtureResult(event.target.value as 'failure' | 'success')
            }
          >
            <option value="failure">Failure</option>
            <option value="success">Success</option>
          </select>
        </label>
        <label>
          Fixture capability{' '}
          <select
            value={capability}
            onChange={(event) => {
              setFixtureCapability(event.target.value)
              setCapability(event.target.value)
            }}
          >
            <option value="supported">Supported</option>
            <option value="unsupported">Unsupported</option>
            <option value="legacy">Legacy response</option>
          </select>
        </label>
        <button onClick={settleFixture}>Resolve pending fixture request</button>
        <button onClick={() => setCounts(fixtureCounts())}>
          Inspect fixture calls
        </button>
        <output aria-label="Fixture calls">{JSON.stringify(counts)}</output>
        <Fixture key={capability} />
      </main>
    </AppProvider>
  )
}
