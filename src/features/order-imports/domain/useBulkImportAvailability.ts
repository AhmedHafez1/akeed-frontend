'use client'

import { useBillingSummary } from '@/features/billing'

export type BulkImportAvailability = 'loading' | 'enabled' | 'disabled'

/**
 * Whether the organization can see file import (story rollout note): the
 * backend reports its flag on the credit summary. If that summary cannot be
 * read, the import API itself answers `IMPORT_DISABLED`, so the page still
 * ends up in the right state.
 */
export function useBulkImportAvailability(): BulkImportAvailability {
  const { summary, isLoading, error } = useBillingSummary()
  if (summary)
    return summary.bulkImportEnabled === true ? 'enabled' : 'disabled'
  if (isLoading) return 'loading'
  return error ? 'enabled' : 'disabled'
}
