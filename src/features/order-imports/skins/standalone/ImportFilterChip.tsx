'use client'

import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { orderImportDetailOptions } from '../../api/orderImportQueries'

interface ImportFilterChipProps {
  batchId: string
  onClear: () => void
}

/**
 * "From import: {file}" on the verifications list.
 *
 * Shown when the merchant follows "Review orders" from a finished import, so
 * the filtered list explains itself rather than looking like a list that lost
 * most of its rows. Dismissing it only clears the filter.
 */
export function ImportFilterChip({ batchId, onClear }: ImportFilterChipProps) {
  const t = useTranslations('orderImport')
  const detail = useQuery(orderImportDetailOptions(batchId))
  // The file name is a nicety; the chip must appear even while it loads, or
  // the filtered list is briefly unexplained.
  const fileName = detail.data?.fileName ?? ''

  return (
    <span className="border-border bg-muted text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
      <span className="truncate">
        {t('verificationsChip', { file: fileName })}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('review.clearImportFilter')}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </span>
  )
}
