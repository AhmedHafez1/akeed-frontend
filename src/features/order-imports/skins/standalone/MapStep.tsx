'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  History,
  Minus,
  type LucideIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { withLocale } from '@/shared/lib/locale'
import { queryKeys } from '@/shared/query/keys'
import { cn } from '@/shared/lib/utils'
import { Button, LoadingButton, notify } from '@/shared/ui'
import { useSaveOrderImportMapping } from '../../api/orderImportMutations'
import {
  isOrderImportApiError,
  type OrderImportBatchDetail,
  type OrderImportField,
} from '../../api/orderImportsApi'
import {
  fieldStatus,
  initialMappingForm,
  mappingErrors,
  orderedImportFields,
  requiredImportFields,
  sampleValues,
  toSaveBody,
  type FieldStatus,
  type MappingChecks,
  type MappingError,
  type MappingForm,
} from '../../domain/mappingForm'
import { IMPORT_STEP_HEADING_ID } from './ImportWizardShell'
import { ImportNotice } from './ImportNotice'
import { ImportSettingsPanel, PaymentValuesPanel } from './MappingPanels'
import { selectClasses } from './styles'
import { WizardFooter } from './WizardFooter'

const statusIcons: Record<FieldStatus, LucideIcon> = {
  detected: CheckCircle2,
  saved: History,
  chosen: Check,
  attention: AlertTriangle,
  chooseDateFormat: AlertTriangle,
  missing: Minus,
}

const statusClasses: Record<FieldStatus, string> = {
  detected: 'text-success-subtle-foreground',
  saved: 'text-info-subtle-foreground',
  chosen: 'text-success-subtle-foreground',
  attention: 'text-warning-subtle-foreground',
  chooseDateFormat: 'text-warning-subtle-foreground',
  missing: 'text-muted-foreground',
}

/** Maps the server's 422 field errors onto the form (fields and options). */
function serverErrorsOf(
  fieldErrors: Record<string, string> | undefined
): Partial<Record<OrderImportField | 'dateFormat' | 'payment', string>> {
  const errors: Partial<
    Record<OrderImportField | 'dateFormat' | 'payment', string>
  > = {}
  for (const [key, message] of Object.entries(fieldErrors ?? {})) {
    if (key === 'options.dateFormat') errors.dateFormat = message
    else if (key === 'options.paymentValueMap') errors.payment = message
    else if (orderedImportFields.includes(key as OrderImportField))
      errors[key as OrderImportField] = message
  }
  return errors
}

interface MapStepProps {
  detail: OrderImportBatchDetail
  canEdit: boolean
  /** The server accepted the mapping; the page re-reads the batch. */
  onSaved: () => void
}

/** Step 2 (M3): confirm which column feeds each field, and the options. */
export function MapStep({ detail, canEdit, onSaved }: MapStepProps) {
  const t = useTranslations('orderImport')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const save = useSaveOrderImportMapping(detail.batchId)
  const [form, setForm] = useState<MappingForm>(() =>
    initialMappingForm(detail)
  )
  const [checks, setChecks] = useState<MappingChecks>({
    paymentValues: detail.paymentValues,
    dateFormat: detail.dateFormat,
  })
  const [attempted, setAttempted] = useState(false)
  const [serverErrors, setServerErrors] = useState<
    ReturnType<typeof serverErrorsOf>
  >({})

  const errors = mappingErrors(form, checks)
  const hasErrors = Object.keys(errors).length > 0
  const suggestions = useMemo(
    () =>
      new Map(
        detail.suggestions.fields.map((suggestion) => [
          suggestion.field,
          suggestion,
        ])
      ),
    [detail.suggestions.fields]
  )
  const used = new Set(
    orderedImportFields.flatMap((field) => form.columns[field])
  )
  const ignored = detail.headers.filter((header) => !used.has(header))

  const update = (next: Partial<MappingForm>) => {
    setForm((current) => ({ ...current, ...next }))
    setServerErrors({})
  }
  const setColumns = (field: OrderImportField, columns: string[]) =>
    update({ columns: { ...form.columns, [field]: columns } })

  const submit = () => {
    setAttempted(true)
    if (hasErrors) {
      // After the errors render, move focus to the first one.
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('[data-mapping-error="true"]')
          ?.focus()
      )
      return
    }
    save.mutate(toSaveBody(form, checks), {
      onSuccess: onSaved,
      onError: (error) => {
        if (!isOrderImportApiError(error)) {
          notify.error({ message: t('map.saveFailed') })
          return
        }
        if (error.code === 'IMPORT_MAPPING_INCOMPLETE') {
          setChecks((current) => ({
            paymentValues:
              error.paymentValues !== undefined
                ? error.paymentValues
                : current.paymentValues,
            dateFormat:
              error.dateFormat !== undefined
                ? error.dateFormat
                : current.dateFormat,
          }))
          setServerErrors(serverErrorsOf(error.fieldErrors))
          return
        }
        if (
          error.code === 'IMPORT_BATCH_EXPIRED' ||
          error.code === 'IMPORT_BATCH_STATE_CONFLICT' ||
          error.code === 'IMPORT_BATCH_NOT_FOUND'
        ) {
          // The batch moved on; re-read it so the page shows where it is.
          void queryClient.invalidateQueries({
            queryKey: queryKeys.orderImports.detail(detail.batchId),
          })
          return
        }
        notify.error({ message: t('map.saveFailed') })
      },
    })
  }

  const errorText = (
    key: OrderImportField | 'dateFormat' | 'payment'
  ): string | null => {
    const local: MappingError | undefined = errors[key]
    if (local && (attempted || local === 'duplicateColumn'))
      return t(`map.errors.${local}`)
    return serverErrors[key] ?? null
  }

  return (
    <section aria-labelledby={IMPORT_STEP_HEADING_ID} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-card border-border bg-card border">
          <div className="border-border space-y-1 border-b p-5">
            <h2
              id={IMPORT_STEP_HEADING_ID}
              tabIndex={-1}
              className="text-foreground text-h3 font-semibold focus:outline-none"
            >
              {t('map.heading')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t.rich('map.description', {
                file: () => (
                  <bdi className="text-foreground font-medium">
                    {detail.fileName}
                  </bdi>
                ),
              })}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="border-border text-muted-foreground hidden grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,9rem)] gap-4 border-b px-5 py-3 text-xs font-semibold md:grid"
          >
            <span>{t('map.fieldHeader')}</span>
            <span>{t('map.columnHeader')}</span>
            <span>{t('map.statusHeader')}</span>
          </div>

          <ul className="divide-border divide-y">
            {orderedImportFields.map((field) => {
              const status = fieldStatus(
                field,
                suggestions.get(field),
                form,
                checks
              )
              const Icon = statusIcons[status]
              const selectId = `order-import-map-${field}`
              const error = errorText(field)
              const samples = sampleValues(
                detail.sampleRows,
                form.columns[field]
              )
              const columns = form.columns[field]
              return (
                <li
                  key={field}
                  className="grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,9rem)] md:items-start md:gap-4"
                >
                  <label
                    htmlFor={selectId}
                    className="text-foreground pt-2 text-sm font-medium"
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
                      headers={detail.headers}
                      disabled={!canEdit}
                      invalid={error !== null}
                      describedBy={`${selectId}-hint`}
                      onChange={(column) =>
                        setColumns(
                          field,
                          column
                            ? [column, ...columns.slice(1)].filter(
                                (value, index, all) =>
                                  all.indexOf(value) === index
                              )
                            : []
                        )
                      }
                    />
                    {field === 'customerName' && columns.length > 0 && (
                      <SecondNameColumn
                        columns={columns}
                        headers={detail.headers}
                        disabled={!canEdit}
                        onChange={(second) =>
                          setColumns(
                            'customerName',
                            second ? [columns[0], second] : [columns[0]]
                          )
                        }
                      />
                    )}
                    <p
                      id={`${selectId}-hint`}
                      className="text-muted-foreground text-xs"
                    >
                      {samples.length > 0 ? (
                        <>
                          {t('map.samples')}{' '}
                          {samples.map((sample, index) => (
                            <span key={index}>
                              {index > 0 && t('map.sampleSeparator')}
                              <bdi className="text-foreground/80">{sample}</bdi>
                            </span>
                          ))}
                        </>
                      ) : columns.length > 0 ? (
                        t('map.noSamples')
                      ) : null}
                    </p>
                    {error && (
                      <p
                        role="alert"
                        className="text-destructive text-xs font-medium"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                  <p
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium md:pt-2.5',
                      statusClasses[status]
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    {t(`map.status.${status}`)}
                  </p>
                </li>
              )
            })}
          </ul>

          {ignored.length > 0 && (
            <details className="border-border group border-t px-5 py-4">
              <summary className="text-foreground focus-visible:ring-ring flex cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none">
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform group-open:rotate-180"
                />
                {t('map.ignored', { count: ignored.length })}
              </summary>
              <ul className="mt-3 flex flex-wrap gap-2">
                {ignored.map((header) => (
                  <li
                    key={header}
                    className="border-border bg-muted text-muted-foreground rounded-md border px-2 py-1 text-xs"
                  >
                    <bdi>{header}</bdi>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="space-y-5">
          <ImportSettingsPanel
            form={form}
            checks={checks}
            disabled={!canEdit}
            dateFormatError={errorText('dateFormat')}
            onChange={update}
          />
          <PaymentValuesPanel
            form={form}
            checks={checks}
            disabled={!canEdit}
            error={errorText('payment')}
            onChange={update}
          />
        </div>
      </div>

      {attempted && hasErrors && (
        <ImportNotice tone="warning" role="alert">
          {t('map.fixBeforeContinue')}
        </ImportNotice>
      )}

      <WizardFooter
        secondary={
          <Button asChild variant="outline">
            <Link href={withLocale('/imports/new', locale)}>
              {t('map.back')}
            </Link>
          </Button>
        }
        primary={
          canEdit && (
            <LoadingButton
              type="button"
              size="lg"
              className="w-full md:w-auto"
              loading={save.isPending}
              loadingText={t('map.saving')}
              onClick={submit}
            >
              {t('map.continue')}
            </LoadingButton>
          )
        }
        note={t('nothingSent.short')}
      />
    </section>
  )
}

function ColumnSelect({
  id,
  value,
  headers,
  disabled,
  invalid,
  describedBy,
  onChange,
  label,
}: {
  id: string
  value: string
  headers: readonly string[]
  disabled: boolean
  invalid: boolean
  describedBy?: string
  onChange: (column: string) => void
  label?: string
}) {
  const t = useTranslations('orderImport.map')
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        data-mapping-error={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          selectClasses,
          invalid && 'border-destructive-border focus:ring-destructive-border'
        )}
      >
        <option value="">{t('notProvided')}</option>
        {headers.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
      />
    </div>
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
      invalid={false}
      label={t('secondName')}
      onChange={(column) => onChange(column || null)}
    />
  )
}
