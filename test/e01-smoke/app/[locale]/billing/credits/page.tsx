'use client'

import { BillingStandalonePage } from '@/features/billing'
import { FixtureStandaloneShell } from '../../FixtureStandaloneShell'

/*
 * Billing & credits inside the production shell (see
 * settingsBillingFixture.ts). Scenarios: `account=healthy|low|zero|suspended`,
 * `pending=1`.
 */
export default function ShellBillingFixturePage() {
  return (
    <FixtureStandaloneShell>
      <BillingStandalonePage />
    </FixtureStandaloneShell>
  )
}
