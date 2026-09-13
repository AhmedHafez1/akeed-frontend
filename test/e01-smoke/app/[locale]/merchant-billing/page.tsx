'use client'

import { useState } from 'react'
import { BillingStandalonePage } from '@/features/billing'
import { billingFixtureCounts } from '../billingFixture'

export default function MerchantBillingFixturePage() {
  const [counts, setCounts] = useState(billingFixtureCounts())
  return (
    <div className="akeed-app-canvas min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto mb-4 flex max-w-[1400px] justify-end">
        <output aria-label="Merchant billing fixture calls">
          {JSON.stringify(counts)}
        </output>
        <button
          className="ms-3"
          type="button"
          onClick={() => setCounts(billingFixtureCounts())}
        >
          Inspect merchant billing calls
        </button>
      </div>
      <BillingStandalonePage />
    </div>
  )
}
