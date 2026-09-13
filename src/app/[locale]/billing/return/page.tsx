'use client'

import { BillingReturnPage, StandaloneBillingRoute } from '@/features/billing'

export default function BillingReturnRoute() {
  return (
    <StandaloneBillingRoute>
      <BillingReturnPage />
    </StandaloneBillingRoute>
  )
}
