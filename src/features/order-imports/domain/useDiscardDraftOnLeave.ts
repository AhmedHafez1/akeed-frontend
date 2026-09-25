'use client'

import { useCallback } from 'react'
import { useDiscardOrderImport } from '../api/orderImportMutations'
import type { OrderImportBatchDetail } from '../api/orderImportsApi'

type LeavingBatch = Pick<
  OrderImportBatchDetail,
  'batchId' | 'status' | 'permissions'
>

/** Only an unfinished draft the caller may edit is thrown away. */
export function shouldDiscardOnLeave(
  batch: LeavingBatch | undefined
): batch is LeavingBatch {
  return batch?.status === 'draft' && batch.permissions.canEdit
}

/**
 * Leaving the modal (close, or "Change file") starts over: a batch still in
 * `draft` is deleted with its rows, so nothing is left to resume. A batch past
 * draft is the merchant's import and is left exactly as it is.
 *
 * Fire and forget: the modal is already gone, so a failure is not shown. The
 * server replaces the merchant's leftover drafts on their next upload anyway.
 */
export function useDiscardDraftOnLeave(batch: LeavingBatch | undefined) {
  const { mutate } = useDiscardOrderImport()
  return useCallback(() => {
    if (shouldDiscardOnLeave(batch)) mutate(batch.batchId)
  }, [batch, mutate])
}
