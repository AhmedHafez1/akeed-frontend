'use client'

import { useState } from 'react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { useDashboard } from '@/features/dashboard/domain/useDashboard'
import { useMainConfirmationsTab } from '@/features/dashboard/domain/useMainConfirmationsTab'
import { DashboardVerificationsEmbeddedSkin } from '@/features/dashboard/skins/embedded/DashboardVerificationsEmbeddedSkin'
import { DashboardVerificationsStandaloneSkin } from '@/features/dashboard/skins/standalone/DashboardVerificationsStandaloneSkin'
import {
  fixtureCounts,
  setFixtureResult,
  setFixtureRole,
  settleFixture,
  setFixtureCapability,
} from './fixtureApi'

function StandaloneFixture() {
  const dashboard = useDashboard()
  return <DashboardVerificationsStandaloneSkin {...dashboard} />
}

function EmbeddedFixture() {
  const confirmations = useMainConfirmationsTab('last_30_days')
  return (
    <DashboardVerificationsEmbeddedSkin
      {...confirmations}
      stats={null}
      isStatsLoading={false}
      sourceStatus="connected"
      dateRangeFilter="last_30_days"
      dateRangeOptions={[]}
      onDateRangeFilterChange={() => undefined}
    />
  )
}

export default function SmokePage() {
  const [skin, setSkin] = useState('embedded')
  const [capability, setCapability] = useState('supported')
  const [role, setRole] = useState<'owner' | 'admin' | 'viewer'>('owner')
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
          Fixture role{' '}
          <select
            id="fixture-role"
            value={role}
            onChange={(event) => {
              const nextRole = event.target.value as
                | 'owner'
                | 'admin'
                | 'viewer'
              setFixtureRole(nextRole)
              setRole(nextRole)
            }}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
        <label>
          Fixture skin{' '}
          <select
            id="fixture-skin"
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
            id="fixture-result"
            defaultValue="failure"
            onChange={(event) =>
              setFixtureResult(
                event.target.value as 'failure' | 'role_denied' | 'success'
              )
            }
          >
            <option value="failure">Failure</option>
            <option value="role_denied">Role denied (stale 403)</option>
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
        <Fixture key={`${capability}-${role}`} />
      </main>
    </AppProvider>
  )
}
