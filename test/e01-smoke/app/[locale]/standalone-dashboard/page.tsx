'use client'

import {
  DashboardStandaloneSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'

/**
 * The production standalone dashboard over the embedded fixture's synthetic
 * backend (`../embedded-dashboard/embeddedDashboardFixture.ts`), with the same
 * `?scenario=` values. No authentication, no provider requests.
 */
export default function StandaloneDashboardFixturePage() {
  const url = useStandaloneDashboardUrlState()
  return (
    <main className="akeed-app-canvas min-h-screen p-4 sm:p-6 lg:px-8 lg:py-8">
      <DashboardStandaloneSkin
        period={url.period}
        periodOptions={url.periodOptions}
        onPeriodChange={url.onPeriodChange}
        needsActionHref={url.confirmationsHref('needs_action')}
      />
    </main>
  )
}
