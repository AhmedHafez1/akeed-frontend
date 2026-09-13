'use client'

import { useState } from 'react'
import { useBillingSummary } from '@/features/billing'
import { useDashboard } from '@/features/dashboard/domain/useDashboard'
import { DashboardVerificationsStandaloneSkin } from '@/features/dashboard/skins/standalone/DashboardVerificationsStandaloneSkin'
import {
  ManualOrderReconciler,
  ManualOrderTopBarAction,
} from '@/features/orders'
import { orderSyncSnapshot, resetOrderSyncFixture } from './orderSyncFixture'

/**
 * The create-order → every-view sync path on one page: the top-bar dialog,
 * the reconciler the standalone shell mounts, the verifications table and
 * stats, and the credit balance — each reading the shared query cache.
 */
export default function OrderSyncFixturePage() {
  const dashboard = useDashboard()
  const { summary } = useBillingSummary()
  const [snapshot, setSnapshot] = useState(orderSyncSnapshot)

  return (
    <main className="akeed-app-canvas min-h-screen p-4 sm:p-6 lg:px-8 lg:py-8">
      <ManualOrderReconciler />
      <div
        className="mx-auto mb-6 flex max-w-[1400px] flex-wrap items-center gap-3 text-xs"
        dir="ltr"
      >
        <label>
          Worker{' '}
          <select
            id="order-sync-worker"
            aria-label="Order sync worker speed"
            defaultValue="fast"
          >
            <option value="fast">Fast (1.5s)</option>
            <option value="slow">Slow (8s)</option>
            <option value="never">Never materializes</option>
          </select>
        </label>
        <label>
          Result{' '}
          <select
            id="order-sync-result"
            aria-label="Order sync result"
            defaultValue="success"
          >
            <option value="success">Accepted (202)</option>
            <option value="duplicate">Duplicate replay</option>
            <option value="failure">Acceptance failure (503)</option>
          </select>
        </label>
        <output aria-label="Order sync credits">
          {summary
            ? `Available: ${summary.availableCredits} · Posted: ${summary.postedBalance} · Held: ${summary.heldCredits}`
            : 'Credits: …'}
        </output>
        <button type="button" onClick={() => setSnapshot(orderSyncSnapshot())}>
          Inspect order sync fixture
        </button>
        <button
          type="button"
          onClick={() => {
            resetOrderSyncFixture()
            window.location.reload()
          }}
        >
          Reset
        </button>
        <ManualOrderTopBarAction />
      </div>
      <DashboardVerificationsStandaloneSkin {...dashboard} />
      <pre
        aria-label="Order sync fixture state"
        className="mx-auto mt-8 max-w-[1400px] text-xs break-all whitespace-pre-wrap"
        dir="ltr"
      >
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </main>
  )
}
