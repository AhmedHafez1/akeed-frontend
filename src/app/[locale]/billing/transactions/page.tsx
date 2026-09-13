'use client'

import { StandaloneBillingRoute, TransactionsPage } from '@/features/billing'

export default function BillingTransactionsRoute() {
  return (
    <StandaloneBillingRoute>
      <TransactionsPage />
    </StandaloneBillingRoute>
  )
}
