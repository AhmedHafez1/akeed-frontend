'use client'

import { BillingReturnPage } from '@/features/billing'
import { FixtureStandaloneShell } from '../../FixtureStandaloneShell'

/*
 * Back from Paymob inside the production shell (see
 * settingsBillingFixture.ts). Needs `?purchaseRef=akd_<32 hex>`; scenarios:
 * `outcome=successful|pending|failed|expired`.
 */
export default function BillingReturnFixturePage() {
  return (
    <FixtureStandaloneShell>
      <BillingReturnPage />
    </FixtureStandaloneShell>
  )
}
