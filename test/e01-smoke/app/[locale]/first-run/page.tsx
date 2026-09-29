'use client'

import { Suspense } from 'react'
import {
  DashboardStandaloneSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'
import { SendTestToPhoneAction } from '@/features/onboarding'
import {
  StandaloneShellProvider,
  useStandaloneShell,
} from '@/shared/layout/StandaloneShellContext'
import { StandaloneSidebar } from '@/shared/layout/StandaloneSidebar'
import { StandaloneTopBar } from '@/shared/layout/StandaloneTopBar'

/*
 * The standalone dashboard's first run, with the production sidebar, top bar
 * and skin over an in-memory backend (see firstRunFixture.ts). Scenarios:
 * ?scenario=first-run | skipped-test | zero-balance | active.
 */
function Dashboard() {
  const url = useStandaloneDashboardUrlState()
  const { identity } = useStandaloneShell()
  return (
    <DashboardStandaloneSkin
      period={url.period}
      periodOptions={url.periodOptions}
      onPeriodChange={url.onPeriodChange}
      confirmationsHref={url.confirmationsHref}
      firstName={identity.fullName?.split(/\s+/)[0] ?? null}
      phoneTestAction={<SendTestToPhoneAction />}
    />
  )
}

export default function FirstRunFixturePage() {
  return (
    <Suspense>
      <StandaloneShellProvider>
        <div className="akeed-app-canvas text-foreground flex min-h-screen">
          <StandaloneSidebar className="sticky top-0 hidden h-screen lg:flex" />
          <div className="flex min-w-0 flex-1 flex-col">
            <StandaloneTopBar onOpenNavigation={() => undefined} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <Dashboard />
            </main>
          </div>
        </div>
      </StandaloneShellProvider>
    </Suspense>
  )
}
