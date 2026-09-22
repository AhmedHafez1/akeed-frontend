'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from '@/features/dashboard/domain/useDashboard'
import { useVerificationStatusQuery } from '@/features/dashboard/hooks/useVerificationStatusQuery'
import { DashboardVerificationsStandaloneSkin } from '@/features/dashboard/skins/standalone/DashboardVerificationsStandaloneSkin'
import { ImportFilterChip, NewImportLink } from '@/features/order-imports'
import { applyResolvedTheme } from '@/shared/theme/theme.dom'
import { verificationRequests } from './verificationFixture'

export default function VerificationFixturePage() {
  const filters = useVerificationStatusQuery()
  const dashboard = useDashboard(
    filters.statusFilter,
    filters.onStatusFilterChange,
    filters.importBatchId
  )
  const [requests, setRequests] = useState<string[]>([])
  // `?theme=dark`, as on the import fixture pages.
  useEffect(() => {
    const theme = new URLSearchParams(window.location.search).get('theme')
    applyResolvedTheme(theme === 'dark' ? 'dark' : 'light')
  }, [])
  return (
    <main className="akeed-app-canvas min-h-screen p-4 sm:p-6 lg:px-8 lg:py-8">
      {/* The same header action as src/app/[locale]/verifications/page.tsx. */}
      <DashboardVerificationsStandaloneSkin
        {...dashboard}
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            {filters.importBatchId && (
              <ImportFilterChip
                batchId={filters.importBatchId}
                onClear={filters.onClearImportBatch}
              />
            )}
            <NewImportLink />
          </div>
        }
      />
      <aside
        className="mx-auto mt-10 max-w-[1400px] border-t p-4 text-xs"
        dir="ltr"
      >
        <p>
          Isolated fixture: synthetic data, no authentication or provider
          requests.
        </p>
        <button
          type="button"
          onClick={() => setRequests([...verificationRequests])}
        >
          Inspect fixture requests
        </button>
        <pre
          aria-label="Fixture requests"
          className="break-all whitespace-pre-wrap"
        >
          {requests.join('\n')}
        </pre>
      </aside>
    </main>
  )
}
