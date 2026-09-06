'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { VERIFICATION_STATUS_FILTER_IDS } from '../domain/verificationFilters'
import type { VerificationStatusFilter } from '../model/dashboard.model'

export function useVerificationStatusQuery() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requested = searchParams.get('status')
  const statusFilter: VerificationStatusFilter =
    VERIFICATION_STATUS_FILTER_IDS.find((status) => status === requested) ??
    'all'

  function onStatusFilterChange(filter: VerificationStatusFilter) {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'all') params.delete('status')
    else params.set('status', filter)
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  return { statusFilter, onStatusFilterChange }
}
