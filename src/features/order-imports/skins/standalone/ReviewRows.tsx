'use client'

import type { ReactNode } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  CopyX,
  MinusCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { SupportedLocale } from '@/shared/lib/locale'
import {
  Badge,
  Button,
  LoadingButton,
  notify,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeProps,
} from '@/shared/ui'
import { useSetOrderImportRowInclude } from '../../api/orderImportMutations'
import { orderImportRowsOptions } from '../../api/orderImportQueries'
import type {
  OrderImportRow,
  OrderImportRowOutcome,
} from '../../api/orderImportsApi'
import { formatImportAmount, formatImportDate } from '../../domain/format'
import { isIncludable } from '../../domain/reviewSummary'
import { useIssueText } from './useIssueText'

const outcomeBadges: Record<
  OrderImportRowOutcome,
  { variant: NonNullable<BadgeProps['variant']>; icon: LucideIcon }
> = {
  ready: { variant: 'success', icon: CheckCircle2 },
  invalid: { variant: 'danger', icon: XCircle },
  duplicate: { variant: 'neutral', icon: CopyX },
  excluded: { variant: 'warning', icon: MinusCircle },
  imported: { variant: 'success', icon: CheckCircle2 },
}

export function OutcomeBadge({ outcome }: { outcome: OrderImportRowOutcome }) {
  const t = useTranslations('orderImport.review.outcome')
  const { variant, icon: Icon } = outcomeBadges[outcome]
  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" className="size-3.5" />
      {t(outcome)}
    </Badge>
  )
}

type RowView = {
  row: OrderImportRow
  customer: string | null
  phone: string | null
  amount: string | null
  reference: string | null
  date: string | null
}

function viewOf(row: OrderImportRow, locale: SupportedLocale): RowView {
  const normalized = row.normalized
  return {
    row,
    customer: normalized?.customerName ?? row.raw.customerName ?? null,
    phone: normalized?.customerPhone ?? row.raw.phone ?? null,
    amount:
      formatImportAmount(
        normalized?.totalPrice,
        normalized?.currency,
        locale
      ) ??
      (row.raw.amount
        ? [row.raw.amount, row.raw.currency].filter(Boolean).join(' ')
        : null),
    reference: normalized?.orderNumber ?? row.raw.orderReference ?? null,
    date: normalized?.orderDate
      ? formatImportDate(normalized.orderDate, locale)
      : null,
  }
}

interface ReviewRowsProps {
  batchId: string
  outcome: OrderImportRowOutcome
  canEdit: boolean
}

/** The rows of one outcome, 50 at a time (story AC5), as a table or cards. */
export function ReviewRows({ batchId, outcome, canEdit }: ReviewRowsProps) {
  const t = useTranslations('orderImport.review')
  const locale = useLocale() as SupportedLocale
  const rows = useInfiniteQuery(orderImportRowsOptions(batchId, outcome))
  const include = useSetOrderImportRowInclude(batchId, outcome)
  const views = (rows.data?.pages ?? [])
    .flatMap((page) => page.rows)
    .map((row) => viewOf(row, locale))

  const toggle = (row: OrderImportRow, next: boolean) =>
    include.mutate(
      { rowNumber: row.rowNumber, include: next },
      { onError: () => notify.error({ message: t('includeFailed') }) }
    )
  const pendingRow = include.isPending
    ? include.variables?.rowNumber
    : undefined

  if (rows.isPending)
    return (
      <div className="space-y-2 p-5" aria-busy="true">
        <span className="sr-only">{t('table.loading')}</span>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )

  if (rows.isError)
    return (
      <div role="alert" className="space-y-3 p-5 text-sm">
        <p className="text-foreground">{t('table.error')}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void rows.refetch()}
        >
          {t('table.retry')}
        </Button>
      </div>
    )

  if (views.length === 0)
    return (
      <p className="text-muted-foreground p-8 text-center text-sm">
        {t('table.empty')}
      </p>
    )

  const includeControl = (view: RowView, layout: 'table' | 'card') =>
    canEdit && isIncludable(view.row) ? (
      <IncludeCheckbox
        id={`order-import-include-${layout}-${view.row.rowNumber}`}
        row={view.row}
        disabled={!canEdit || pendingRow === view.row.rowNumber}
        onChange={(next) => toggle(view.row, next)}
      />
    ) : null

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t('table.row')}</TableHead>
              <TableHead>{t('table.customer')}</TableHead>
              <TableHead>{t('table.phone')}</TableHead>
              <TableHead>{t('table.amount')}</TableHead>
              <TableHead>{t('table.reference')}</TableHead>
              <TableHead className="min-w-64">{t('table.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view) => (
              <TableRow key={view.row.rowNumber} className="align-top">
                <TableCell className="text-muted-foreground tabular-nums">
                  {view.row.rowNumber}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {view.customer ? <bdi>{view.customer}</bdi> : '—'}
                </TableCell>
                <TableCell>
                  {view.phone ? (
                    <bdi dir="ltr" className="tabular-nums">
                      {view.phone}
                    </bdi>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {view.amount ? <bdi>{view.amount}</bdi> : '—'}
                </TableCell>
                <TableCell>
                  <ReferenceCell view={view} />
                </TableCell>
                <TableCell>
                  <RowStatus view={view}>
                    {includeControl(view, 'table')}
                  </RowStatus>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-border divide-y md:hidden">
        {views.map((view) => (
          <li key={view.row.rowNumber} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-foreground truncate font-medium">
                  {view.customer ? <bdi>{view.customer}</bdi> : '—'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t('table.rowNumber', { number: view.row.rowNumber })}
                </p>
              </div>
              <OutcomeBadge outcome={view.row.outcome ?? outcome} />
            </div>
            <p className="text-foreground flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {view.phone && (
                <bdi dir="ltr" className="tabular-nums">
                  {view.phone}
                </bdi>
              )}
              {view.amount && <bdi className="tabular-nums">{view.amount}</bdi>}
            </p>
            <ReferenceCell view={view} />
            <RowIssues row={view.row} />
            {includeControl(view, 'card')}
          </li>
        ))}
      </ul>

      {rows.hasNextPage && (
        <div className="border-border border-t p-4 text-center">
          <LoadingButton
            type="button"
            variant="outline"
            loading={rows.isFetchingNextPage}
            onClick={() => void rows.fetchNextPage()}
          >
            {t('table.loadMore')}
          </LoadingButton>
        </div>
      )}
    </>
  )
}

function ReferenceCell({ view }: { view: RowView }) {
  if (!view.reference && !view.date) return <span>—</span>
  return (
    <span className="text-muted-foreground block text-sm">
      {view.reference && (
        <bdi className="text-foreground block">{view.reference}</bdi>
      )}
      {view.date && <span className="block text-xs">{view.date}</span>}
    </span>
  )
}

function RowStatus({
  view,
  children,
}: {
  view: RowView
  children?: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {view.row.outcome && <OutcomeBadge outcome={view.row.outcome} />}
      <RowIssues row={view.row} />
      {children}
    </div>
  )
}

/** Every issue of the row, localized (story AC5). */
function RowIssues({ row }: { row: OrderImportRow }) {
  const issueText = useIssueText()
  const issues = row.issues.filter((issue) => !issue.informational)
  const notes = row.issues.filter((issue) => issue.informational)
  if (issues.length === 0 && notes.length === 0) return null
  return (
    <ul className="space-y-1 text-xs leading-5">
      {issues.map((issue, index) => (
        <li
          key={`${issue.code}-${index}`}
          className="text-foreground/80 flex items-start gap-1.5"
        >
          <AlertTriangle
            aria-hidden="true"
            className="text-warning-subtle-foreground mt-0.5 size-3.5 shrink-0"
          />
          {issueText(issue)}
        </li>
      ))}
      {notes.map((issue, index) => (
        <li
          key={`note-${issue.code}-${index}`}
          className="text-muted-foreground"
        >
          {issueText(issue)}
        </li>
      ))}
    </ul>
  )
}

function IncludeCheckbox({
  id,
  row,
  disabled,
  onChange,
}: {
  id: string
  row: OrderImportRow
  disabled: boolean
  onChange: (include: boolean) => void
}) {
  const t = useTranslations('orderImport.review')
  return (
    <label
      htmlFor={id}
      className="text-foreground inline-flex cursor-pointer items-center gap-2 text-sm font-medium"
    >
      <input
        id={id}
        type="checkbox"
        checked={row.includeOverride}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-primary size-4"
      />
      {t('includeAnyway')}
    </label>
  )
}
