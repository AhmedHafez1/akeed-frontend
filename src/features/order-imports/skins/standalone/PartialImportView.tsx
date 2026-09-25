'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { Button } from '@/shared/ui'
import type { OrderImportBatchDetail } from '../../api/orderImportsApi'
import { importModalPath, importOrdersPath } from '../../domain/importRoutes'
import { IMPORT_STEP_HEADING_ID } from './importHeading'
import { ImportNotice } from './ImportNotice'

/**
 * The commit ran out of retries (AC7).
 *
 * The orders that made it are real and still held, so this screen reports the
 * split honestly and points at the two things the merchant can still do:
 * review what was imported, and re-upload the rest.
 */
export function PartialImportView({
  detail,
}: {
  detail: OrderImportBatchDetail
}) {
  const t = useTranslations('orderImport')
  const locale = useLocale()
  const imported = detail.counts.imported ?? 0
  const attempted = detail.counts.readyAtCommit ?? imported
  const missing = Math.max(attempted - imported, 0)

  return (
    <section className="space-y-6">
      <h2
        id={IMPORT_STEP_HEADING_ID}
        tabIndex={-1}
        className="text-foreground text-h3 font-semibold focus:outline-none"
      >
        {t('partial.heading')}
      </h2>

      <ImportNotice tone="critical" role="alert" title={t('partial.title')}>
        {t('partial.body', { imported, attempted, missing })}
      </ImportNotice>

      <ImportNotice tone="safe">{t('imported.nothingSent')}</ImportNotice>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="ghost" disabled>
          {t('imported.downloadReport')}
        </Button>
        <Button asChild variant="outline">
          <Link href={withLocale(importOrdersPath(detail.batchId), locale)}>
            {t('imported.reviewOrders')}
          </Link>
        </Button>
        <Button asChild>
          <Link href={withLocale(importModalPath('new'), locale)}>
            {t('partial.reupload')}
          </Link>
        </Button>
      </div>
    </section>
  )
}
