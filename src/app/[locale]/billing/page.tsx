'use client'

import {
  BillingStandalonePage,
  StandaloneBillingRoute,
} from '@/features/billing'

export default function BillingPage() {
  return (
    <StandaloneBillingRoute>
      <BillingStandalonePage />
    </StandaloneBillingRoute>
  )
}
