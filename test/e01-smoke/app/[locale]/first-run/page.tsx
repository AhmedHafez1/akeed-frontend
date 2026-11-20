'use client'

import {
  DashboardStandaloneSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'
import { SendTestToPhoneAction } from '@/features/onboarding'
import { useStandaloneShell } from '@/shared/layout/StandaloneShellContext'
import { FixtureStandaloneShell } from '../FixtureStandaloneShell'

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
    <FixtureStandaloneShell>
      <Dashboard />
    </FixtureStandaloneShell>
  )
}
