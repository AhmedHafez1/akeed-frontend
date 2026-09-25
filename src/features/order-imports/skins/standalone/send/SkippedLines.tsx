'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { MinusCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { queryKeys } from '@/shared/query/keys'
import { Button, notify } from '@/shared/ui'
import { useSetOrderImportRowInclude } from '../../../api/orderImportMutations'
import type { OrderImportRow } from '../../../api/orderImportsApi'
import {
  isPaymentReason,
  skipGroups,
  type SkipGroup,
} from '../../../domain/sendSummary'
import { useIssueText } from '../useIssueText'
import { hasPhoneIssue, RowPhoneFix } from './RowPhoneFix'

/**
 * The rows that stay out, one line per reason ("4 مستبعدة لأنها مدفوعة
 * مسبقًا"). A payment reason goes back to the check; the others open their
 * rows, where a possible duplicate can still be included and a bad phone
 * fixed in place.
 */
export function SkippedLines({
  batchId,
  rows,
  canEdit,
  onChangePayment,
}: {
  batchId: string
  rows: readonly OrderImportRow[]
  canEdit: boolean
  /** Undefined once imported: the classification can no longer change. */
  onChangePayment?: () => void
}) {
  const groups = skipGroups(rows)
  if (groups.length === 0) return null
  return (
    <ul className="rounded-card border-border bg-muted/30 divide-border divide-y border">
      {groups.map((group) => (
        <SkippedLine
          key={group.reason}
          batchId={batchId}
          group={group}
          rows={rows}
          canEdit={canEdit}
          onChangePayment={onChangePayment}
        />
      ))}
    </ul>
  )
}

function SkippedLine({
  batchId,
  group,
  rows,
  canEdit,
  onChangePayment,
}: {
  batchId: string
  group: SkipGroup
  rows: readonly OrderImportRow[]
  canEdit: boolean
  onChangePayment?: () => void
}) {
  const t = useTranslations('orderImport.send.skipped')
  const [open, setOpen] = useState(false)
  const listId = `order-import-skipped-${group.reason}`
  const changes = isPaymentReason(group.reason) && onChangePayment

  return (
    <li className="px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <MinusCircle
          aria-hidden="true"
          className="text-muted-foreground size-4 shrink-0"
        />
        <p className="text-foreground min-w-0 flex-1 text-sm">
          {t(group.reason, { count: group.count })}
        </p>
        {changes ? (
          canEdit && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto min-h-11 p-0 sm:min-h-0"
              onClick={onChangePayment}
            >
              {t('change')}
            </Button>
          )
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto min-h-11 p-0 sm:min-h-0"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? t('hide') : t('show')}
          </Button>
        )}
      </div>
      {open && (
        <SkippedRows
          id={listId}
          batchId={batchId}
          rows={rows.filter((row) => group.rowNumbers.includes(row.rowNumber))}
          includable={group.reason === 'possibleDuplicate' && canEdit}
          phoneFixable={canEdit}
        />
      )}
    </li>
  )
}

function SkippedRows({
  id,
  batchId,
  rows,
  includable,
  phoneFixable,
}: {
  id: string
  batchId: string
  rows: readonly OrderImportRow[]
  includable: boolean
  phoneFixable: boolean
}) {
  const t = useTranslations('orderImport.review')
  const issueText = useIssueText()
  const queryClient = useQueryClient()
  const include = useSetOrderImportRowInclude(batchId, 'excluded')

  return (
    <ul id={id} className="mt-2 space-y-2 ps-7">
      {rows.map((row) => (
        <li
          key={row.rowNumber}
          className="border-border bg-card rounded-lg border px-3 py-2 text-sm"
        >
          <p className="text-foreground">
            <span className="text-muted-foreground">
              {t('table.rowNumber', { number: row.rowNumber })}
            </span>
            {row.raw.customerName && (
              <>
                {' · '}
                <bdi>{row.raw.customerName}</bdi>
              </>
            )}
            {row.raw.phone && (
              <>
                {' · '}
                <bdi dir="ltr">{row.raw.phone}</bdi>
              </>
            )}
          </p>
          <ul className="text-muted-foreground mt-0.5 text-xs leading-5">
            {row.issues
              .filter((issue) => !issue.informational)
              .map((issue) => (
                <li key={issue.code}>{issueText(issue)}</li>
              ))}
          </ul>
          {phoneFixable && hasPhoneIssue(row) && (
            <RowPhoneFix batchId={batchId} row={row} />
          )}
          {includable && (
            <label className="text-foreground mt-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm sm:min-h-0">
              <input
                type="checkbox"
                checked={row.includeOverride}
                disabled={include.isPending}
                onChange={(event) =>
                  include.mutate(
                    { rowNumber: row.rowNumber, include: event.target.checked },
                    {
                      // The ready count changed: price it again.
                      onSuccess: () =>
                        void queryClient.invalidateQueries({
                          queryKey: queryKeys.orderImports.startQuote(batchId),
                        }),
                      onError: () =>
                        notify.error({ message: t('includeFailed') }),
                    }
                  )
                }
                className="accent-primary size-4"
              />
              {t('includeAnyway')}
            </label>
          )}
        </li>
      ))}
    </ul>
  )
}
