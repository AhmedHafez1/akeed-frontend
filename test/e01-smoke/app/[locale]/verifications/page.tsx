'use client'

import { useState } from 'react'
import { useDashboard } from '@/features/dashboard/domain/useDashboard'
import { useVerificationStatusQuery } from '@/features/dashboard/hooks/useVerificationStatusQuery'
import { DashboardVerificationsStandaloneSkin } from '@/features/dashboard/skins/standalone/DashboardVerificationsStandaloneSkin'
import { verificationRequests } from './verificationFixture'

export default function VerificationFixturePage() {
  const filters = useVerificationStatusQuery()
  const dashboard = useDashboard(
    filters.statusFilter,
    filters.onStatusFilterChange
  )
  const [requests, setRequests] = useState<string[]>([])
  return (
    <main className="min-h-screen bg-[#f7f7f3] p-4 sm:p-6 lg:px-8 lg:py-8">
      <DashboardVerificationsStandaloneSkin {...dashboard} />
      <aside
        className="mx-auto mt-10 max-w-[1400px] border-t p-4 text-xs"
        dir="ltr"
      >
        <p>
          Isolated fixture: synthetic data, no authentication or provider
          requests.
        </p>
        <button
          type="button"
          onClick={() => setRequests([...verificationRequests])}
        >
          Inspect fixture requests
        </button>
        <pre
          aria-label="Fixture requests"
          className="break-all whitespace-pre-wrap"
        >
          {requests.join('\n')}
        </pre>
      </aside>
    </main>
  )
}
