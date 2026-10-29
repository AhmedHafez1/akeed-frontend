'use client'

import { useEffect, useState } from 'react'
import { Unplug } from 'lucide-react'
import type { AdminUnconnectedStore } from './admin.model'
import { getAdminUnconnectedStores } from './adminApi'
import { formatDateTime, PlatformBadge } from './AdminStoreUi'

/**
 * Stores whose orders keep arriving although Akeed has no integration for
 * them, usually after their rows were deleted while the app stayed installed.
 * Every such order is skipped, so the panel stays hidden until there is one.
 */
export function UnconnectedStoresPanel() {
  const [stores, setStores] = useState<AdminUnconnectedStore[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    getAdminUnconnectedStores()
      .then((response) => {
        if (!cancelled) setStores(response.data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) {
    return (
      <p className="text-muted-foreground text-xs">
        Unconnected stores could not be loaded.
      </p>
    )
  }
  if (!stores?.length) return null

  return (
    <section
      aria-labelledby="unconnected-stores-heading"
      className="border-warning-border bg-card rounded-2xl border shadow-xs"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="bg-warning-subtle text-warning grid size-8 shrink-0 place-items-center rounded-lg">
          <Unplug className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2
            id="unconnected-stores-heading"
            className="text-foreground text-sm font-semibold"
          >
            Orders from unconnected stores ({stores.length})
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            These stores still have the app installed and send orders, but Akeed
            has no integration for them, so no order is verified. Ask the
            merchant to open the app to connect again.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-muted-foreground border-border border-t text-left text-xs">
            <tr>
              <th className="px-4 py-2 font-medium">Store domain</th>
              <th className="px-4 py-2 text-right font-medium">
                Skipped orders
              </th>
              <th className="px-4 py-2 text-right font-medium">Last 7 days</th>
              <th className="px-4 py-2 font-medium">First skipped</th>
              <th className="px-4 py-2 font-medium">Last skipped</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr
                key={`${store.platform}:${store.shop_domain}`}
                className="border-border border-t"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={store.platform} />
                    <span className="text-foreground font-medium">
                      {store.shop_domain}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {store.unique_orders}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {store.unique_orders_7d}
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-xs">
                  {formatDateTime(store.first_received_at)}
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-xs">
                  {formatDateTime(store.last_received_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
