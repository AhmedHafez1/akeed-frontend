'use client'

import { useEffect, useRef } from 'react'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import type { OrderImportBatchDetail } from '../api/orderImportsApi'
import { releaseProgress } from './releaseSummary'

/**
 * While a started import's detail is polled, refreshes the confirmations list
 * and the balance whenever more sends get an outcome, so the rows and the
 * credits agree with the progress the merchant is looking at.
 */
export function useReleaseOutcomeSync(
  detail: Pick<OrderImportBatchDetail, 'lifecycle' | 'release'> | undefined
) {
  const emit = useEmitDomainEvent()
  const settled = detail ? releaseProgress(detail).settled : null
  const seen = useRef<number | null>(null)

  useEffect(() => {
    if (settled === null) return
    const previous = seen.current
    seen.current = settled
    if (previous !== null && settled !== previous)
      void emit('orderImport.progressed')
  }, [settled, emit])
}
