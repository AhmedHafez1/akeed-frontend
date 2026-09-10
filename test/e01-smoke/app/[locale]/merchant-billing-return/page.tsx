'use client'

import { BillingProvider, BillingReturnPage } from '@/features/billing'

export default function MerchantBillingReturnFixturePage() {
  return (
    <BillingProvider>
      <main className="akeed-app-canvas min-h-screen p-4">
        <BillingReturnPage />
      </main>
    </BillingProvider>
  )
}
