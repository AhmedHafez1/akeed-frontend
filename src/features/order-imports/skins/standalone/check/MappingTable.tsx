'use client'

import { useState, type ReactNode } from 'react'
import { AlertTriangle, Check, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'
import type {
  OrderImportDateFormat,
  OrderImportField,
  OrderImportFieldSuggestion,
  OrderImportSampleRow,
} from '../../../api/orderImportsApi'
import {
  fieldStatus,
  optionalImportFields,
  primaryImportFields,
  requiredImportFields,
  sampleValues,
  showsDateFormat,
  suggestColumn,
  type MappingChecks,
  type MappingForm,
} from '../../../domain/mappingForm'
import { ColumnSelect } from './ColumnSelect'

type RowStatus = 'matched' | 'required' | 'check' | 'none'

function rowStatus(
  field: OrderImportField,
  suggestion: OrderImportFieldSuggestion | undefined,
  form: MappingForm,
  checks: MappingChecks
): RowStatus {
  const status = fieldStatus(field, suggestion, form, checks)
  if (status === 'missing') return 'none'
  if (status === 'attention')
    return form.columns[field].length === 0 ? 'required' : 'check'
  if (status === 'chooseDateFormat') return 'check'
  return 'matched'
}

export interface MappingTableProps {
  headers: readonly string[]
  sampleRows: readonly OrderImportSampleRow[]
  form: MappingForm
  checks: MappingChecks
  suggestions: ReadonlyMap<OrderImportField, OrderImportFieldSuggestion>
  canEdit: boolean
  errorText: (key: OrderImportField | 'dateFormat') => string | null
  onColumns: (field: OrderImportField, columns: string[]) => void
  onDateFormat: (format: OrderImportDateFormat) => void
}

/**
 * The focused mapping: the required fields, the order number and the
 * payment column, each with real example values; the optional fields fold
 * away. An empty required field is highlighted and offered a likely column.
 */
export function MappingTable(props: MappingTableProps) {
  const t = useTranslations('orderImport')
  const { form, checks } = props
  const datePrimary = showsDateFormat(form, checks)
  const primary = datePrimary
    ? [...primaryImportFields, 'orderDate' as const]
    : primaryImportFields
  const optional = optionalImportFields.filter(
    (field) => !primary.includes(field)
  )

  return (
    <div className="rounded-card border-border bg-card overflow-hidden border">
      <div
        aria-hidden="true"
        className="border-border bg-muted/50 text-muted-foreground hidden grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)] gap-4 border-b px-5 py-2.5 text-xs font-medium md:grid"
      >
        <span>{t('check.table.field')}</span>
        <span>{t('check.table.column')}</span>
        <span className="sr-only">{t('check.table.status')}</span>
      </div>
      <ul className="divide-border divide-y">
        {primary.map((field) => (
          <FieldRow key={field} field={field} {...props} />
        ))}
      </ul>
      {optional.length > 0 && (
        <OptionalFields fields={optional} form={form}>
          <ul className="divide-border border-border divide-y border-t">
            {optional.map((field) => (
              <FieldRow key={field} field={field} {...props} />
            ))}
          </ul>
        </OptionalFields>
      )}
    </div>
  )
}

function FieldRow({
  field,
  headers,
  sampleRows,
  form,
  checks,
  suggestions,
  canEdit,
  errorText,
  onColumns,
  onDateFormat,
}: MappingTableProps & { field: OrderImportField }) {
  const t = useTranslations('orderImport')
  const selectId = `order-import-map-${field}`
  const columns = form.columns[field]
  const status = rowStatus(field, suggestions.get(field), form, checks)
  const needsColumn = status === 'required'
  const error = errorText(field)
  const samples = sampleValues(sampleRows, columns)
  const used = new Set(Object.values(form.columns).flat())
  const suggested = needsColumn
    ? suggestColumn(field, suggestions.get(field), headers, sampleRows, used)
    : null
  const separator = t('map.sampleSeparator')

  const choose = (column: string) =>
    onColumns(
      field,
      column
        ? [column, ...columns.slice(1)].filter(
            (value, index, all) => all.indexOf(value) === index
          )
        : []
    )

  return (
    <li
      className={cn(
        'grid gap-2 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)] md:items-start md:gap-4',
        needsColumn && 'bg-warning-subtle/50'
      )}
    >
      <label
        htmlFor={selectId}
        className="text-foreground pt-2.5 text-sm font-semibold"
      >
        {t(`map.fields.${field}`)}
        {requiredImportFields.has(field) && (
          <>
            <span aria-hidden="true" className="text-destructive">
              {' *'}
            </span>
            <span className="sr-only">{t('map.required')}</span>
          </>
        )}
      </label>

      <div className="min-w-0 space-y-2">
        <ColumnSelect
          id={selectId}
          value={columns[0] ?? ''}
          headers={headers}
          disabled={!canEdit}
          attention={needsColumn}
          invalid={error !== null && !needsColumn}
          describedBy={`${selectId}-hint`}
          onChange={choose}
        />
        {field === 'customerName' && columns.length > 0 && (
          <SecondNameColumn
            columns={columns}
            headers={headers}
            disabled={!canEdit}
            onChange={(second) =>
              onColumns(
                'customerName',
                second ? [columns[0], second] : [columns[0]]
              )
            }
          />
        )}
        <p id={`${selectId}-hint`} className="text-muted-foreground text-xs">
          {samples.length > 0 && (
            <>
              {t('check.samples', { values: '' })}
              {samples.map((sample, index) => (
                <span key={sample}>
                  {index > 0 && separator}
                  <bdi dir="auto" className="text-foreground/80">
                    {sample}
                  </bdi>
                </span>
              ))}
            </>
          )}
        </p>
        {suggested && canEdit && (
          <SuggestionCard
            column={suggested}
            samples={sampleValues(sampleRows, [suggested])}
            fieldName={t(`map.fields.${field}`)}
            onUse={() => choose(suggested)}
          />
        )}
        {field === 'orderDate' && showsDateFormat(form, checks) && (
          <DateFormatChoice
            value={form.dateFormat}
            disabled={!canEdit}
            error={errorText('dateFormat')}
            onChange={onDateFormat}
          />
        )}
        {error && !needsColumn && (
          <p role="alert" className="text-destructive text-xs font-medium">
            {error}
          </p>
        )}
      </div>

      <RowStatusLabel status={status} />
    </li>
  )
}

function RowStatusLabel({ status }: { status: RowStatus }) {
  const t = useTranslations('orderImport.check.status')
  if (status === 'none')
    return (
      <p aria-hidden="true" className="text-muted-foreground text-xs md:pt-3">
        —
      </p>
    )
  const matched = status === 'matched'
  const Icon = matched ? Check : AlertTriangle
  return (
    <p
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium md:pt-3',
        matched
          ? 'text-success-subtle-foreground'
          : 'text-warning-subtle-foreground'
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {t(status)}
    </p>
  )
}

/** «هل هو «رقم التواصل»؟ مثل: …» with one tap to use it. */
function SuggestionCard({
  column,
  samples,
  fieldName,
  onUse,
}: {
  column: string
  samples: readonly string[]
  fieldName: string
  onUse: () => void
}) {
  const t = useTranslations('orderImport')
  return (
    <div className="border-warning-border bg-card flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3">
      <p className="text-foreground min-w-0 flex-1 text-sm">
        <span className="font-semibold">
          {t('check.suggestion.question', { column })}
        </span>
        {samples.length > 0 && (
          <span className="text-muted-foreground">
            {' '}
            {t('check.samples', { values: '' })}
            <bdi dir="ltr">{samples.join(t('map.sampleSeparator'))}</bdi>
          </span>
        )}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 sm:min-h-0"
        aria-label={t('check.suggestion.useLabel', {
          column,
          field: fieldName,
        })}
        onClick={onUse}
      >
        {t('check.suggestion.use')}
      </Button>
    </div>
  )
}

/** Dates like 05/06/2026 read two ways: the merchant says which. */
function DateFormatChoice({
  value,
  disabled,
  error,
  onChange,
}: {
  value: OrderImportDateFormat
  disabled: boolean
  error: string | null
  onChange: (format: OrderImportDateFormat) => void
}) {
  const t = useTranslations('orderImport.settings')
  return (
    <fieldset className="space-y-2" aria-describedby="order-import-date-help">
      <legend className="text-foreground text-sm font-medium">
        {t('dateFormat')}
      </legend>
      <p id="order-import-date-help" className="text-muted-foreground text-xs">
        {t('dateFormatHelp')}
      </p>
      <div className="flex flex-wrap gap-2">
        {(['DMY', 'MDY'] as const).map((format) => (
          <label
            key={format}
            className="border-border has-[:checked]:border-primary has-[:checked]:bg-primary-subtle flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm sm:min-h-10"
          >
            <input
              type="radio"
              name="order-import-date-format"
              value={format}
              checked={value === format}
              data-mapping-error={
                (error !== null && format === 'DMY') || undefined
              }
              disabled={disabled}
              onChange={() => onChange(format)}
              className="accent-primary size-4"
            />
            <span className="text-foreground">{t(format)}</span>
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** "حقول اختيارية  المدينة ✓ · العنوان ✓ · تاريخ الطلب —", folded. */
function OptionalFields({
  fields,
  form,
  children,
}: {
  fields: readonly OrderImportField[]
  form: MappingForm
  children: ReactNode
}) {
  const t = useTranslations('orderImport')
  return (
    <details className="group border-border border-t">
      <summary className="bg-muted/40 hover:bg-muted focus-visible:ring-ring flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:px-5">
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
        <span className="text-foreground font-semibold">
          {t('check.optional.title')}
        </span>
        <span className="text-muted-foreground text-xs">
          {fields.map((field, index) => {
            const mapped = form.columns[field].length > 0
            const name = t(`map.fields.${field}`)
            return (
              <span key={field}>
                {index > 0 && ' · '}
                <span aria-hidden="true">
                  {name} {mapped ? '✓' : '—'}
                </span>
                <span className="sr-only">
                  {mapped
                    ? t('check.optional.mapped', { field: name })
                    : t('check.optional.missing', { field: name })}
                </span>
              </span>
            )
          })}
        </span>
      </summary>
      {children}
    </details>
  )
}

/** A full name may come from a first and a last name column (US-04.6-03). */
function SecondNameColumn({
  columns,
  headers,
  disabled,
  onChange,
}: {
  columns: readonly string[]
  headers: readonly string[]
  disabled: boolean
  onChange: (column: string | null) => void
}) {
  const t = useTranslations('orderImport.map')
  const [open, setOpen] = useState(columns.length > 1)
  if (!open)
    return (
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {t('addSecondName')}
      </Button>
    )
  return (
    <ColumnSelect
      id="order-import-map-customerName-2"
      value={columns[1] ?? ''}
      headers={headers.filter((header) => header !== columns[0])}
      disabled={disabled}
      label={t('secondName')}
      onChange={(column) => onChange(column || null)}
    />
  )
}
