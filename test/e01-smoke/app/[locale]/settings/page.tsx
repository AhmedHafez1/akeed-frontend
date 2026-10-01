'use client'

import { SettingsStandalonePage } from '@/features/settings'
import { FixtureStandaloneShell } from '../FixtureStandaloneShell'

/*
 * The standalone Settings page inside the production shell, over an in-memory
 * backend (see settingsBillingFixture.ts). `?tab=message|timing|store`;
 * scenarios: `role=viewer`, `save=fail`.
 */
export default function SettingsFixturePage() {
  return (
    <FixtureStandaloneShell>
      <SettingsStandalonePage />
    </FixtureStandaloneShell>
  )
}
