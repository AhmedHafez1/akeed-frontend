'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import { Button } from '@/shared/ui'
import type { OrderImportBatchDetail } from '../../api/orderImportsApi'
import { importOrdersPath } from '../../domain/importRoutes'
import { IMPORT_STEP_HEADING_ID } from './importHeading'
import { ImportNotice } from './ImportNotice'
import { StartConfirmationDialog } from './StartConfirmationDialog'

/** The five counts the merchant is shown, in the order M6 frame B lists them. */
const pills = [
  'awaitingStart',
  'invalid',
  'duplicate',
  'excluded',
  'alreadyImported',
] as const

/**
 * M6 frame B: the orders exist, held, and nothing has been sent.
 *
 * The deliberate gap between importing and confirming is the point of this
 * screen, so the reassurance line and the deadline are as prominent as the
 * count, and the only emerald action is the one the merchant has not taken.
 */
export function ImportedView({
  detail,
  canEdit,
  openStartOnLoad = false,
  onStartClosed,
}: {
  detail: OrderImportBatchDetail
  canEdit: boolean
  /** Back from buying credits: reopen the dialog, which re-quotes. */
  openStartOnLoad?: boolean
  onStartClosed?: () => void
}) {
  const t = useTranslations('orderImport')
  const locale = useLocale()
  const format = useFormatter()
  const emitDomainEvent = useEmitDomainEvent()
  const [startOpen, setStartOpen] = useState(openStartOnLoad && canEdit)

  const counts = detail.counts
  const imported = counts.imported ?? 0

  // The orders appeared while this page was open, so the lists that show them
  // are stale. Emitted once: the batch is terminal until the merchant starts it.
  const announced = useRef(false)
  useEffect(() => {
    if (announced.current) return
    announced.current = true
    // Both: `order.created` for the credit and page-context refresh the
    // manual path also triggers, and the commit event for the lists, which
    // `order.created` deliberately leaves alone for manual orders.
    void emitDomainEvent('order.created')
    void emitDomainEvent('orderImport.committed')
  }, [emitDomainEvent])

  const pillCount: Record<(typeof pills)[number], number> = {
    awaitingStart: imported,
    invalid: counts.invalid ?? 0,
    duplicate: counts.duplicate ?? 0,
    excluded: counts.excluded ?? 0,
    // Rows whose reference another import claimed first, counted at commit.
    alreadyImported: Math.max((counts.readyAtCommit ?? imported) - imported, 0),
  }

  return (
    <section className="space-y-6">
      <div className="rounded-card border-success-border bg-success-subtle text-success-subtle-foreground flex flex-col gap-3 border p-6 sm:flex-row sm:items-start">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            id={IMPORT_STEP_HEADING_ID}
            tabIndex={-1}
            className="text-h3 font-semibold focus:outline-none"
          >
            {t('imported.heading', { count: imported })}
          </h2>
          <p className="text-sm leading-6">{t('imported.nothingSent')}</p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {pills.map((pill) => (
          <li
            key={pill}
            className="rounded-card border-border bg-card flex flex-col gap-1 border p-4"
          >
            <span className="text-foreground text-2xl font-bold tabular-nums">
              {pillCount[pill]}
            </span>
            <span className="text-muted-foreground text-xs leading-5">
              {t(`imported.pills.${pill}`)}
            </span>
          </li>
        ))}
      </ul>

      {detail.startDeadlineAt && (
        <ImportNotice tone="warning" role="status">
          <span className="inline-flex items-center gap-2">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            <span>
              {t('imported.deadline', {
                deadline: format.dateTime(new Date(detail.startDeadlineAt), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              })}
            </span>
          </span>
        </ImportNotice>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="ghost" disabled>
          {t('imported.downloadReport')}
        </Button>
        <Button asChild variant="outline">
          <Link href={withLocale(importOrdersPath(detail.batchId), locale)}>
            {t('imported.reviewOrders')}
          </Link>
        </Button>
        {canEdit && (
          <Button size="lg" onClick={() => setStartOpen(true)}>
            {t('imported.start')}
          </Button>
        )}
      </div>

      <StartConfirmationDialog
        batchId={detail.batchId}
        open={startOpen}
        onOpenChange={(open) => {
          setStartOpen(open)
          if (!open) onStartClosed?.()
        }}
      />
    </section>
  )
}
