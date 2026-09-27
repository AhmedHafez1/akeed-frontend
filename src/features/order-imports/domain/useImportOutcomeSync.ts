'use client'

import { useQuery } from '@tanstack/react-query'
import {
  activeImportsOptions,
  orderImportDetailOptions,
} from '../api/orderImportQueries'
import { useBulkImportAvailability } from './useBulkImportAvailability'
import { useReleaseOutcomeSync } from './useReleaseOutcomeSync'

/** Keeps order and credit queries fresh while started imports settle. */
export function useImportOutcomeSync() {
  const enabled = useBulkImportAvailability() === 'enabled'
  const active = useQuery({ ...activeImportsOptions(), enabled })
  const batches = active.data?.batches ?? []
  const followed =
    batches.find(
      (batch) => batch.status === 'releasing' || batch.status === 'paused'
    ) ??
    batches[0] ??
    null
  const detail = useQuery({
    ...orderImportDetailOptions(followed?.batchId ?? ''),
    enabled: enabled && followed !== null,
  })

  useReleaseOutcomeSync(detail.data)
}
