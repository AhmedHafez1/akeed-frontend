'use client'

import { useCallback, useState } from 'react'
import { downloadBlob } from '@/shared/lib/download'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import { fetchConfirmationsExport } from '../api/verificationExport'
import type { ConfirmationsListParams } from '../api/verificationQueries'

const logger = createLogger('ConfirmationsExport')

const TOO_LARGE_CODE = 'VERIFICATION_EXPORT_TOO_LARGE'

export type ExportResult = 'done' | 'tooLarge' | 'failed'

/** Message key, under `dashboard.confirmations.export`, for a failed export. */
export function exportErrorKey(result: ExportResult): 'tooLarge' | 'failed' {
  return result === 'tooLarge' ? 'tooLarge' : 'failed'
}

/**
 * Downloads the list on screen as a file named for its tab and period, so a
 * merchant who exports "confirmed" twice a day can tell the files apart.
 */
export function useConfirmationsExport(params: ConfirmationsListParams) {
  const [isExporting, setIsExporting] = useState(false)
  const { tab, dateRange, search, importBatchId } = params

  const exportList = useCallback(async (): Promise<ExportResult> => {
    setIsExporting(true)
    try {
      const blob = await fetchConfirmationsExport({
        tab,
        dateRange,
        search,
        importBatchId,
      })
      const day = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `akeed-${tab}-${dateRange}-${day}.csv`)
      return 'done'
    } catch (error) {
      logger.warn('Confirmations export failed', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      return error instanceof ApiError && error.code === TOO_LARGE_CODE
        ? 'tooLarge'
        : 'failed'
    } finally {
      setIsExporting(false)
    }
  }, [tab, dateRange, search, importBatchId])

  return { exportList, isExporting }
}
