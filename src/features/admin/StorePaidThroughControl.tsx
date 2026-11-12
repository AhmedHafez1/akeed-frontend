'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui'
import { clearAdminStorePaidThrough, type AdminApiError } from './adminApi'
import { AdminErrorPanel } from './AdminErrorPanel'
import { formatDateTime } from './AdminStoreUi'
import { toAdminApiError } from './useStandaloneBillingAccount'

/**
 * The paid-through date of a store that uninstalled mid-period and got its
 * paid plan back on reinstall, with the staff action that removes it (e.g.
 * once the old charge was refunded by hand). Renders nothing without a date.
 */
export function StorePaidThroughControl({
  integrationId,
  paidThroughAt,
  onCleared,
}: {
  integrationId: string
  paidThroughAt: string | null | undefined
  onCleared: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  if (!paidThroughAt) return null

  const clear = async () => {
    if (
      !window.confirm(
        'Clear the paid-through date? The store loses its plan now and is asked to subscribe.'
      )
    )
      return
    setSaving(true)
    setError(null)
    try {
      await clearAdminStorePaidThrough(integrationId)
      onCleared()
    } catch (cause) {
      console.error('[Admin] Paid-through clear failed', cause)
      setError(toAdminApiError(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-border mt-4 border-t pt-3">
      <p className="text-foreground text-sm font-medium">
        Paid through {formatDateTime(paidThroughAt)}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        Paid days left from before the uninstall. The plan works without a
        Shopify subscription until then; subscribing now is charged only after.
      </p>
      <Button
        className="mt-3"
        variant="outline"
        size="sm"
        disabled={saving}
        onClick={() => void clear()}
      >
        Clear paid-through date
      </Button>
      {error && (
        <div className="mt-3">
          <AdminErrorPanel
            compact
            message={error.message}
            requestId={error.requestId}
            onRetry={() => void clear()}
          />
        </div>
      )}
    </div>
  )
}
