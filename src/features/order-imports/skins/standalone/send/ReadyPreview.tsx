'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { SupportedLocale } from '@/shared/lib/locale'
import { formatPhoneInternational } from '@/shared/lib/phone'
import { Button } from '@/shared/ui'
import type { OrderImportRow } from '../../../api/orderImportsApi'
import { formatImportAmount } from '../../../domain/format'

const PREVIEW_ROWS = 3

/** Three ready orders, then all of them (a file holds at most 100). */
export function ReadyPreview({ rows }: { rows: readonly OrderImportRow[] }) {
  const t = useTranslations('orderImport')
  const locale = useLocale() as SupportedLocale
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? rows : rows.slice(0, PREVIEW_ROWS)
  if (rows.length === 0) return null

  const views = shown.map((row) => {
    const order = row.normalized
    return {
      key: row.rowNumber,
      customer: order?.customerName ?? row.raw.customerName ?? '—',
      phone: formatPhoneInternational(order?.customerPhone ?? row.raw.phone),
      amount:
        formatImportAmount(order?.totalPrice, order?.currency, locale) ??
        row.raw.amount ??
        '—',
      reference: order?.orderNumber ?? row.raw.orderReference ?? '—',
    }
  })

  return (
    <div className="rounded-card border-border bg-card overflow-hidden border">
      <div
        className={
          expanded ? 'max-h-[min(24rem,50dvh)] overflow-y-auto' : undefined
        }
      >
        <table className="hidden w-full text-sm sm:table">
          <caption className="sr-only">{t('send.previewLabel')}</caption>
          <thead className="bg-muted/50 text-muted-foreground text-xs">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start font-medium">
                {t('review.table.customer')}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium">
                {t('review.table.phone')}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium">
                {t('review.table.amount')}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium">
                {t('review.table.reference')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {views.map((view) => (
              <tr key={view.key}>
                <td className="text-foreground px-4 py-3">
                  <bdi>{view.customer}</bdi>
                </td>
                <td className="text-foreground px-4 py-3 tabular-nums">
                  <bdi dir="ltr">{view.phone}</bdi>
                </td>
                <td className="text-foreground px-4 py-3 tabular-nums">
                  <bdi dir="ltr">{view.amount}</bdi>
                </td>
                <td className="text-foreground px-4 py-3">
                  <bdi dir="ltr">{view.reference}</bdi>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Phones: one line per order, the list rows of the mobile sheet. */}
        <ul
          aria-label={t('send.previewLabel')}
          className="divide-border divide-y sm:hidden"
        >
          {views.map((view) => (
            <li
              key={view.key}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="min-w-0">
                <bdi className="text-foreground block truncate font-medium">
                  {view.customer}
                </bdi>
                <bdi
                  dir="ltr"
                  className="text-muted-foreground block text-xs tabular-nums"
                >
                  {view.phone}
                </bdi>
              </span>
              <bdi dir="ltr" className="text-foreground shrink-0 tabular-nums">
                {view.amount}
              </bdi>
            </li>
          ))}
        </ul>
      </div>

      {rows.length > PREVIEW_ROWS && (
        <div className="border-border border-t px-4 py-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto min-h-11 p-0 sm:min-h-8"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded
              ? t('send.showFewer')
              : t('send.showAll', { count: rows.length })}
          </Button>
        </div>
      )}
    </div>
  )
}
