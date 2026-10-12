import { fetchWithAuth } from '@/shared/lib/auth'
import { createApiError } from '@/shared/lib/http'
import type { ConfirmationsListParams } from './verificationQueries'

/**
 * The confirmations list as a CSV file, filtered like the list on screen.
 * The server refuses a set too large for one file with a coded error.
 */
export async function fetchConfirmationsExport({
  tab,
  dateRange,
  search,
  importBatchId,
}: ConfirmationsListParams): Promise<Blob> {
  const params = new URLSearchParams({ date_range: dateRange })
  if (tab !== 'all') params.set('tab', tab)
  if (search) params.set('q', search)
  if (importBatchId) params.set('importBatchId', importBatchId)

  const response = await fetchWithAuth(`/api/verifications/export?${params}`, {
    cache: 'no-store',
  })
  if (!response.ok) throw await createApiError(response)
  return response.blob()
}
