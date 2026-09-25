'use client'

import { Check, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'
import type { OrderImportPaymentValues } from '../../../api/orderImportsApi'
import {
  paymentBuckets,
  type PaymentBucket,
  type PaymentChip,
} from '../../../domain/paymentBuckets'
import type { MappingForm } from '../../../domain/mappingForm'

interface PaymentBucketsPanelProps {
  /** The payment column the form maps, if any. */
  column: string | undefined
  /** The server's count of that column; null until a new column is saved. */
  values: OrderImportPaymentValues | null
  form: Pick<MappingForm, 'payment' | 'blankPayment'>
  assumeCodWhenBlank: boolean
  open: boolean
  canEdit: boolean
  onOpen: () => void
  onMove: (chip: PaymentChip) => void
}

/**
 * "أي الطلبات نؤكدها؟": the payment column's values as chips in two buckets.
 * Tapping a chip moves it across; the counts follow. Folded to one line while
 * the merchant's attention is needed on the columns.
 */
export function PaymentBucketsPanel({
  column,
  values,
  form,
  assumeCodWhenBlank,
  open,
  canEdit,
  onOpen,
  onMove,
}: PaymentBucketsPanelProps) {
  const t = useTranslations('orderImport.check.payment')

  if (!column)
    return (
      <p
        className={cn(
          'rounded-card flex items-start gap-2 border p-4 text-sm leading-6',
          assumeCodWhenBlank
            ? 'border-border bg-muted/40 text-muted-foreground'
            : 'border-warning-border bg-warning-subtle text-warning-subtle-foreground'
        )}
      >
        <Info aria-hidden="true" className="mt-1 size-4 shrink-0" />
        {assumeCodWhenBlank ? t('noColumnAssume') : t('noColumnSkip')}
      </p>
    )

  if (!values)
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        {t('recount')}
      </p>
    )

  const buckets = paymentBuckets(values, form, assumeCodWhenBlank)
  const names = (chips: PaymentChip[]) =>
    chips.map((chip) => (chip.blank ? t('blank') : chip.label)).join('، ')

  if (!open)
    return (
      <div className="rounded-card border-border bg-card flex flex-wrap items-center gap-x-4 gap-y-2 border px-4 py-3">
        <h3 className="text-foreground text-sm font-semibold">
          {t('question')}
        </h3>
        <p className="text-muted-foreground min-w-0 flex-1 text-sm">
          {buckets.notCod.length > 0
            ? t('summary', {
                confirm: names(buckets.cod),
                ignore: names(buckets.notCod),
              })
            : t('summaryConfirmOnly', { confirm: names(buckets.cod) })}
        </p>
        {canEdit && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto min-h-11 p-0 sm:min-h-0"
            onClick={onOpen}
          >
            {t('edit')}
          </Button>
        )}
      </div>
    )

  return (
    <section aria-labelledby="order-import-payment" className="space-y-3">
      <div className="space-y-1">
        <h3
          id="order-import-payment"
          className="text-foreground text-base font-bold"
        >
          {t('question')}
        </h3>
        <p className="text-muted-foreground text-sm">{t('intro')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Bucket
          bucket="cod"
          chips={buckets.cod}
          rows={buckets.codRows}
          canEdit={canEdit}
          onMove={onMove}
        />
        <Bucket
          bucket="not_cod"
          chips={buckets.notCod}
          rows={buckets.excludedRows}
          canEdit={canEdit}
          onMove={onMove}
        />
      </div>

      {values.truncated && (
        <p className="text-muted-foreground text-xs">
          {/* The shared payment copy explains the 50-value cap. */}
          <TruncatedNote />
        </p>
      )}
      {values.blankCount > 0 && (
        <p className="text-muted-foreground text-xs">{t('blankHint')}</p>
      )}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Check aria-hidden="true" className="size-3.5 shrink-0" />
        {t('remember')}
      </p>
    </section>
  )
}

function TruncatedNote() {
  const t = useTranslations('orderImport.payment')
  return <>{t('truncated')}</>
}

function Bucket({
  bucket,
  chips,
  rows,
  canEdit,
  onMove,
}: {
  bucket: PaymentBucket
  chips: PaymentChip[]
  rows: number
  canEdit: boolean
  onMove: (chip: PaymentChip) => void
}) {
  const t = useTranslations('orderImport.check.payment')
  const confirm = bucket === 'cod'
  const titleId = `order-import-bucket-${bucket}`

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className={cn(
        'rounded-card space-y-3 border p-4',
        confirm
          ? 'border-primary-border bg-primary-subtle/40'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h4
          id={titleId}
          className="text-foreground flex items-center gap-2 text-sm font-semibold"
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-2.5 rounded-full',
              confirm ? 'bg-primary' : 'bg-muted-foreground/60'
            )}
          />
          {t(confirm ? 'confirm' : 'ignore')}
        </h4>
        {/* Live: moving a chip changes both buckets' totals. */}
        <p
          aria-live="polite"
          className={cn(
            'text-xs font-semibold tabular-nums',
            confirm ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {t('orders', { count: rows })}
        </p>
      </div>

      {chips.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t('empty')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.key || 'blank'}>
              <Chip chip={chip} canEdit={canEdit} onMove={onMove} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chip({
  chip,
  canEdit,
  onMove,
}: {
  chip: PaymentChip
  canEdit: boolean
  onMove: (chip: PaymentChip) => void
}) {
  const t = useTranslations('orderImport.check.payment')
  const confirm = chip.bucket === 'cod'
  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
          confirm ? 'bg-card text-foreground' : 'bg-muted text-foreground'
        )}
      >
        {chip.count}
      </span>
      {chip.blank ? t('blank') : <bdi>{chip.label}</bdi>}
    </>
  )
  const classes = cn(
    'inline-flex min-h-11 items-center gap-2 rounded-full border ps-1.5 pe-3 text-sm sm:min-h-9',
    confirm
      ? 'border-primary-border bg-primary-subtle text-primary-subtle-foreground'
      : 'border-border bg-card text-foreground',
    chip.blank && 'border-dashed'
  )

  if (!canEdit)
    return (
      <span className={classes}>
        {body}
        <span className="sr-only">{t('orders', { count: chip.count })}</span>
      </span>
    )

  return (
    <button
      type="button"
      // Pressed = these orders are confirmed; pressing moves them across.
      aria-pressed={confirm}
      aria-label={`${t('confirmValue', {
        value: chip.blank ? t('blank') : chip.label,
      })} · ${t('orders', { count: chip.count })}`}
      onClick={() => onMove(chip)}
      className={cn(
        classes,
        'focus-visible:ring-ring cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none',
        confirm ? 'hover:bg-primary-subtle/70' : 'hover:bg-muted'
      )}
    >
      {body}
    </button>
  )
}
