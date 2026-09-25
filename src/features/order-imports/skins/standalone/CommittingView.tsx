'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { Button, LoadingSpinner, Progress } from '@/shared/ui'
import type { OrderImportBatchDetail } from '../../api/orderImportsApi'
import { IMPORT_STEP_HEADING_ID } from './importHeading'
import { ImportNotice } from './ImportNotice'

/**
 * M6 frame A. The orders are being created; the merchant is told the count and
 * that they are free to leave, because a large import outlasts their patience
 * and the job does not need the tab open.
 */
export function CommittingView({ detail }: { detail: OrderImportBatchDetail }) {
  const t = useTranslations('orderImport')
  const locale = useLocale()
  const done = detail.counts.imported ?? 0
  const total = detail.counts.readyAtCommit ?? done
  // Before the first chunk lands there is nothing to divide by; show the bar
  // at zero rather than a misleading full one.
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <section className="space-y-6">
      <h2
        id={IMPORT_STEP_HEADING_ID}
        tabIndex={-1}
        className="text-foreground text-h3 font-semibold focus:outline-none"
      >
        {t('commit.heading')}
      </h2>

      <div className="rounded-card border-border bg-card space-y-4 border p-6">
        <LoadingSpinner message={t('commit.progress', { done, total })} />
        <Progress value={percent} aria-label={t('commit.heading')} />
        <p className="text-muted-foreground text-sm leading-6">
          {t('commit.leavePage')}
        </p>
      </div>

      <ImportNotice tone="safe">{t('nothingSent.banner')}</ImportNotice>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={withLocale('/verifications', locale)}>
            {t('commit.back')}
          </Link>
        </Button>
      </div>
    </section>
  )
}
