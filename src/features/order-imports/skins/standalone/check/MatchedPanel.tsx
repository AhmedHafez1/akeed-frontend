'use client'

import { ArrowRight, CircleCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui'
import type { OrderImportField } from '../../../api/orderImportsApi'

/**
 * Every required column matched with confidence: the mapping is one panel of
 * chips (الهاتف ← Phone) and one quiet line for what the file lacks.
 */
export function MatchedPanel({
  mapped,
  missing,
  canEdit,
  onEdit,
}: {
  mapped: ReadonlyArray<{ field: OrderImportField; columns: string[] }>
  missing: readonly OrderImportField[]
  canEdit: boolean
  onEdit: () => void
}) {
  const t = useTranslations('orderImport')
  const fieldName = (field: OrderImportField) => t(`map.fields.${field}`)

  return (
    <section
      aria-labelledby="order-import-matched"
      className="rounded-card border-primary-border bg-primary-subtle/40 space-y-3 border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="order-import-matched"
          className="text-foreground flex items-center gap-2 text-sm font-semibold sm:text-base"
        >
          <CircleCheck aria-hidden="true" className="text-primary size-5" />
          {t('check.matched.title')}
        </h3>
        {canEdit && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto min-h-11 p-0 sm:min-h-0"
            onClick={onEdit}
          >
            {t('check.matched.edit')}
          </Button>
        )}
      </div>

      <ul className="flex flex-wrap gap-2">
        {mapped.map(({ field, columns }) => (
          <li
            key={field}
            className="border-border bg-card inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
          >
            <span className="sr-only">
              {t('check.matched.chip', {
                field: fieldName(field),
                column: columns.join(' + '),
              })}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              {fieldName(field)}
            </span>
            <ArrowRight
              aria-hidden="true"
              className="text-muted-foreground size-3.5 rtl:rotate-180"
            />
            <bdi aria-hidden="true" className="text-foreground font-semibold">
              {columns.join(' + ')}
            </bdi>
          </li>
        ))}
      </ul>

      {missing.length > 0 && (
        <p className="text-muted-foreground text-xs leading-5">
          {t('check.matched.missing', {
            fields: missing.map(fieldName).join(t('map.sampleSeparator')),
          })}
          {missing.includes('orderDate') && ` ${t('check.matched.noDate')}`}
        </p>
      )}
    </section>
  )
}
