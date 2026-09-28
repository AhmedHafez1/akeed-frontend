'use client'

import {
  DashboardVerificationsStandaloneSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'

/**
 * The production standalone confirmations list over the embedded fixture's
 * synthetic backend, with the same `?scenario=` values and `?tab=` / `?range=`
 * as the real page.
 */
export default function StandaloneConfirmationsFixturePage() {
  const url = useStandaloneDashboardUrlState()
  return (
    <main className="akeed-app-canvas min-h-screen p-4 sm:p-6 lg:px-8 lg:py-8">
      <DashboardVerificationsStandaloneSkin
        period={url.period}
        periodOptions={url.periodOptions}
        onPeriodChange={url.onPeriodChange}
        tab={url.tab}
        onTabChange={url.onTabChange}
        importBatchId={url.importBatchId}
      />
    </main>
  )
}
