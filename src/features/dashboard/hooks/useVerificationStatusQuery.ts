'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { STANDALONE_STATUS_FILTER_IDS } from '../domain/verificationFilters'
import type { VerificationStatusFilter } from '../model/dashboard.model'

export function useVerificationStatusQuery() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requested = searchParams.get('status')
  const statusFilter: VerificationStatusFilter =
    STANDALONE_STATUS_FILTER_IDS.find((status) => status === requested) ?? 'all'
  // Set when the merchant arrives from an import; cleared by its chip.
  const importBatchId = searchParams.get('importBatchId') ?? undefined

  function onStatusFilterChange(filter: VerificationStatusFilter) {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'all') params.delete('status')
    else params.set('status', filter)
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  function onClearImportBatch() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('importBatchId')
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  return {
    statusFilter,
    onStatusFilterChange,
    importBatchId,
    onClearImportBatch,
  }
}
