'use client'

import { useState } from 'react'
import { ManualOrderEntryStandalone } from '@/features/orders'
import {
  manualOrderFixtureSnapshot,
  resetManualOrderFixture,
  settleManualOrderFixture,
} from './manualOrderFixture'

export default function ManualOrderSmokePage() {
  const [canCreate, setCanCreate] = useState(true)
  const [sourceConnected, setSourceConnected] = useState(true)
  const [snapshot, setSnapshot] = useState(manualOrderFixtureSnapshot())

  return (
    <main style={{ padding: 24 }}>
      <h1>US-04-02 isolated manual order fixture — no provider network</h1>
      <p>Authentication and full dashboard layout are checked separately.</p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <label>
          Fixture role{' '}
          <select
            aria-label="Manual order fixture role"
            value={canCreate ? 'owner' : 'viewer'}
            onChange={(event) => setCanCreate(event.target.value === 'owner')}
          >
            <option value="owner">Owner/admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
        <label>
          Fixture source{' '}
          <select
            aria-label="Manual order fixture source"
            value={sourceConnected ? 'connected' : 'disconnected'}
            onChange={(event) =>
              setSourceConnected(event.target.value === 'connected')
            }
          >
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </label>
        <label>
          Fixture result{' '}
          <select
            id="manual-order-fixture-outcome"
            aria-label="Manual order fixture result"
            defaultValue="success"
          >
            <option value="success">Success</option>
            <option value="duplicate">Duplicate replay</option>
            <option value="held_success">Held success</option>
            <option value="validation">Server validation</option>
            <option value="role">Role denied</option>
            <option value="source">Source blocked</option>
            <option value="entitlement">Entitlement blocked</option>
            <option value="conflict">Idempotency conflict</option>
            <option value="acceptance">Acceptance failure</option>
            <option value="unexpected">Unexpected server failure</option>
            <option value="network">Network failure</option>
            <option value="timeout">30-second timeout</option>
          </select>
        </label>
        <button type="button" onClick={settleManualOrderFixture}>
          Resolve pending manual order
        </button>
        <button
          type="button"
          onClick={() => setSnapshot(manualOrderFixtureSnapshot())}
        >
          Inspect manual order calls
        </button>
        <button
          type="button"
          onClick={() => {
            resetManualOrderFixture()
            setSnapshot(manualOrderFixtureSnapshot())
          }}
        >
          Reset manual order calls
        </button>
      </div>
      <output aria-label="Manual order fixture calls">
        {JSON.stringify(snapshot)}
      </output>
      <div style={{ marginTop: 24 }}>
        <ManualOrderEntryStandalone
          canCreate={canCreate}
          defaultCurrency="EGP"
          sourceConnected={sourceConnected}
        />
      </div>
    </main>
  )
}
