'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  activeImportsOptions,
  orderImportDetailOptions,
} from '../api/orderImportQueries'
import {
  followedImport,
  importProgressChip,
  type ImportProgressChip,
} from './importProgress'
import { useBulkImportAvailability } from './useBulkImportAvailability'
import { useReleaseOutcomeSync } from './useReleaseOutcomeSync'

export type ImportProgress = {
  batchId: string
  fileName: string
  chip: ImportProgressChip
  dismiss: () => void
}

/**
 * The started import the top bar reports on, polled while it sends. As its
 * sends settle, the confirmations list and the balance refresh with it, so
 * the chip and the rows say the same thing.
 *
 * The finished summary shows only after this tab watched the import move,
 * until the merchant dismisses it: an import that finished before the page
 * opened has nothing new to say.
 */
export function useImportProgress(): ImportProgress | null {
  const enabled = useBulkImportAvailability() === 'enabled'
  const active = useQuery({ ...activeImportsOptions(), enabled })
  const followed = followedImport(active.data?.batches ?? [])
  const detail = useQuery({
    ...orderImportDetailOptions(followed?.batchId ?? ''),
    enabled: enabled && followed !== null,
  })
  useReleaseOutcomeSync(detail.data)
  const [watchedId, setWatchedId] = useState<string | null>(null)
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const chip = detail.data ? importProgressChip(detail.data) : null
  if (!followed || !chip || detail.data?.batchId !== followed.batchId)
    return null
  // Derived during render, not in an effect: seeing it move is the fact.
  if (chip.kind !== 'done' && watchedId !== followed.batchId)
    setWatchedId(followed.batchId)
  if (dismissedId === followed.batchId) return null
  if (chip.kind === 'done' && watchedId !== followed.batchId) return null

  return {
    batchId: followed.batchId,
    fileName: followed.fileName,
    chip,
    dismiss: () => setDismissedId(followed.batchId),
  }
}
