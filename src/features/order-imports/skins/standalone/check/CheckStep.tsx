'use client'

import { useMemo, useReducer, useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronDown, FileSpreadsheet } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { useAssumeCodWhenPaymentMissing } from '@/features/settings'
import { orderCurrencies } from '@/shared/commerce/orderCommerce'
import { queryKeys } from '@/shared/query/keys'
import { Button, LoadingButton, notify } from '@/shared/ui'
import {
  ALLOWED_COUNTRIES,
  getCountryCallingCode,
} from '@/shared/ui/international-phone-input'
import { useSaveOrderImportMapping } from '../../../api/orderImportMutations'
import {
  isOrderImportApiError,
  type OrderImportBatchDetail,
  type OrderImportField,
} from '../../../api/orderImportsApi'
import { flowReducer, initialFlow } from '../../../domain/importFlow'
import {
  attentionFields,
  countryChange,
  initialMappingForm,
  isAllMatched,
  mappingErrors,
  orderedImportFields,
  requiredImportFields,
  toSaveBody,
  type MappingChecks,
  type MappingForm,
} from '../../../domain/mappingForm'
import { moveChip, paymentBuckets } from '../../../domain/paymentBuckets'
import { IMPORT_STEP_HEADING_ID } from '../importHeading'
import { ImportNotice } from '../ImportNotice'
import { ModalStepLayout } from '../modal/ModalStepLayout'
import { selectClasses } from '../styles'
import { MappingTable } from './MappingTable'
import { MatchedPanel } from './MatchedPanel'
import { PaymentBucketsPanel } from './PaymentBucketsPanel'

type ErrorKey = OrderImportField | 'dateFormat' | 'payment'

/** Maps the server's 422 field errors onto the form (fields and options). */
function serverErrorsOf(
  fieldErrors: Record<string, string> | undefined
): Partial<Record<ErrorKey, string>> {
  const errors: Partial<Record<ErrorKey, string>> = {}
  for (const [key, message] of Object.entries(fieldErrors ?? {})) {
    if (key === 'options.dateFormat') errors.dateFormat = message
    else if (key === 'options.paymentValueMap') errors.payment = message
    else if (orderedImportFields.includes(key as OrderImportField))
      errors[key as OrderImportField] = message
  }
  return errors
}

interface CheckStepProps {
  detail: OrderImportBatchDetail
  canEdit: boolean
  /** The server accepted the mapping and validated the rows. */
  onSaved: () => void
  /** Back to step 1 for another file; this one stays a draft. */
  onChangeFile: () => void
  /** Shown first, e.g. "you uploaded this file yesterday". */
  notice?: ReactNode
}

/**
 * Step 2 (الفحص). Collapsed to one panel when every required column matched,
 * a focused table otherwise; then which payment values are confirmed.
 */
export function CheckStep({
  detail,
  canEdit,
  onSaved,
  onChangeFile,
  notice,
}: CheckStepProps) {
  const t = useTranslations('orderImport')
  const queryClient = useQueryClient()
  const save = useSaveOrderImportMapping(detail.batchId)
  const assumeCodWhenBlank = useAssumeCodWhenPaymentMissing() ?? false
  const [form, setForm] = useState<MappingForm>(() =>
    initialMappingForm(detail)
  )
  const [checks, setChecks] = useState<MappingChecks>({
    paymentValues: detail.paymentValues,
    dateFormat: detail.dateFormat,
  })
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<ErrorKey, string>>
  >({})
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
  // Auto-advance: the first render decides collapsed or focused.
  const [flow, dispatch] = useReducer(flowReducer, undefined, () =>
    flowReducer(initialFlow, {
      type: 'checkOpened',
      allMatched: isAllMatched(suggestions, form, checks),
    })
  )

  const attention = attentionFields(suggestions, form, checks)
  const errors = mappingErrors(form, checks)
  const blocked = attention.length > 0 || Object.keys(errors).length > 0
  const paymentColumn = form.columns.paymentMethod[0]
  const paymentValues =
    paymentColumn !== undefined &&
    checks.paymentValues?.column === paymentColumn
      ? checks.paymentValues
      : null

  const update = (next: Partial<MappingForm>) => {
    setForm((current) => ({ ...current, ...next }))
    setServerErrors({})
  }

  const submit = () => {
    if (blocked) return
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
          dispatch({ type: 'editMapping' })
          return
        }
        if (
          error.code === 'IMPORT_BATCH_EXPIRED' ||
          error.code === 'IMPORT_BATCH_STATE_CONFLICT' ||
          error.code === 'IMPORT_BATCH_NOT_FOUND'
        ) {
          // The batch moved on; re-read it so the modal shows where it is.
          void queryClient.invalidateQueries({
            queryKey: queryKeys.orderImports.detail(detail.batchId),
          })
          return
        }
        notify.error({ message: t('map.saveFailed') })
      },
    })
  }

  const errorText = (key: ErrorKey): string | null => {
    const local = errors[key]
    if (local === 'duplicateColumn') return t('map.errors.duplicateColumn')
    return serverErrors[key] ?? null
  }

  const mapped = orderedImportFields
    .filter((field) => form.columns[field].length > 0)
    .map((field) => ({ field, columns: form.columns[field] }))
  const missing = orderedImportFields.filter(
    (field) =>
      !requiredImportFields.has(field) && form.columns[field].length === 0
  )

  return (
    <ModalStepLayout
      footer={
        <CheckFooter
          canEdit={canEdit}
          saving={save.isPending}
          blockedReason={
            attention.length === 1
              ? t('check.footer.blockedOne', {
                  field: t(`map.fields.${attention[0]}`),
                })
              : attention.length > 1
                ? t('check.footer.blockedMany')
                : blocked
                  ? t('check.footer.fixErrors')
                  : null
          }
          summary={
            paymentValues ? (
              <ReadySummary
                {...paymentBuckets(paymentValues, form, assumeCodWhenBlank)}
              />
            ) : null
          }
          onBack={onChangeFile}
          onContinue={submit}
        />
      }
    >
      <h2
        id={IMPORT_STEP_HEADING_ID}
        tabIndex={-1}
        className="sr-only focus:outline-none"
      >
        {t('check.heading')}
      </h2>
      {notice}

      <FileAndOptions
        detail={detail}
        form={form}
        disabled={!canEdit}
        onChangeFile={onChangeFile}
        onChange={update}
      />

      {!flow.mappingOpen ? (
        <MatchedPanel
          mapped={mapped}
          missing={missing}
          canEdit={canEdit}
          onEdit={() => dispatch({ type: 'editMapping' })}
        />
      ) : (
        <div className="space-y-3">
          {attention.length > 0 && (
            <ImportNotice tone="warning" role="status">
              <span className="font-semibold">
                {attention.length === 1
                  ? t('check.attention.one', {
                      detail: t(`check.attention.why.${attention[0]}`),
                    })
                  : t('check.attention.many', { count: attention.length })}
              </span>
            </ImportNotice>
          )}
          <MappingTable
            headers={detail.headers}
            sampleRows={detail.sampleRows}
            form={form}
            checks={checks}
            suggestions={suggestions}
            canEdit={canEdit}
            errorText={errorText}
            onColumns={(field, columns) =>
              update({ columns: { ...form.columns, [field]: columns } })
            }
            onDateFormat={(dateFormat) => update({ dateFormat })}
          />
        </div>
      )}

      <PaymentBucketsPanel
        column={paymentColumn}
        values={paymentValues}
        form={form}
        assumeCodWhenBlank={assumeCodWhenBlank}
        open={flow.paymentOpen}
        canEdit={canEdit}
        onOpen={() => dispatch({ type: 'editPayment' })}
        onMove={(chip) => update(moveChip(form, chip))}
      />
      {errorText('payment') && (
        <p role="alert" className="text-destructive text-xs font-medium">
          {errorText('payment')}
        </p>
      )}
    </ModalStepLayout>
  )
}

/** The file (name, rows, change) and its two options, inline. */
function FileAndOptions({
  detail,
  form,
  disabled,
  onChangeFile,
  onChange,
}: {
  detail: OrderImportBatchDetail
  form: MappingForm
  disabled: boolean
  onChangeFile: () => void
  onChange: (next: Partial<MappingForm>) => void
}) {
  const t = useTranslations('orderImport.check')
  const locale = useLocale()
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: 'region' })
    return ALLOWED_COUNTRIES.map((code) => ({
      code,
      label: `${names.of(code) ?? code} (+${getCountryCallingCode(code)})`,
    })).sort((a, b) => a.label.localeCompare(b.label, locale))
  }, [locale])
  const currencies = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: 'currency' })
    return orderCurrencies.map((code) => ({
      code,
      label: `${names.of(code) ?? code} · ${code}`,
    }))
  }, [locale])

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm lg:pb-2.5">
        <FileSpreadsheet
          aria-hidden="true"
          className="text-primary size-5 shrink-0"
        />
        <bdi className="text-foreground truncate font-semibold">
          {detail.fileName}
        </bdi>
        <span className="text-muted-foreground">
          · {t('rows', { count: detail.rowCount })}
        </span>
        {!disabled && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto min-h-11 p-0 sm:min-h-0"
            onClick={onChangeFile}
          >
            {t('changeFile')}
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem] lg:shrink-0">
        <InlineSelect
          id="order-import-country"
          label={t('country')}
          value={form.country}
          disabled={disabled}
          options={countries}
          onChange={(country) => onChange(countryChange(form, country))}
        />
        <InlineSelect
          id="order-import-currency"
          label={t('currency')}
          value={form.currency}
          disabled={disabled}
          options={currencies}
          onChange={(currency) =>
            onChange({ currency: currency as MappingForm['currency'] })
          }
        />
      </div>
    </div>
  )
}

function InlineSelect({
  id,
  label,
  value,
  disabled,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  disabled: boolean
  options: ReadonlyArray<{ code: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-foreground text-xs font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`${selectClasses} h-11 sm:h-10`}
        >
          {options.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
        />
      </div>
    </div>
  )
}

/** "5 جاهزة · 4 مستبعدة": zero counts are left out. */
function ReadySummary({
  codRows,
  excludedRows,
}: {
  codRows: number
  excludedRows: number
}) {
  const t = useTranslations('orderImport.check.footer')
  return (
    <p aria-live="polite" className="text-muted-foreground text-sm">
      {t('ready', { count: codRows })}
      {excludedRows > 0 && ` · ${t('excluded', { count: excludedRows })}`}
    </p>
  )
}

function CheckFooter({
  canEdit,
  saving,
  blockedReason,
  summary,
  onBack,
  onContinue,
}: {
  canEdit: boolean
  saving: boolean
  blockedReason: string | null
  summary: ReactNode
  onBack: () => void
  onContinue: () => void
}) {
  const t = useTranslations('orderImport')
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        className="h-11 sm:h-10"
        onClick={onBack}
      >
        {t('map.back')}
      </Button>
      {canEdit && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-4">
          {blockedReason ? (
            <p
              id="order-import-check-blocked"
              className="text-warning-subtle-foreground flex items-center gap-1.5 text-sm"
            >
              <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
              {blockedReason}
            </p>
          ) : (
            summary
          )}
          <LoadingButton
            type="button"
            size="lg"
            className="h-12 w-full sm:h-11 sm:w-auto"
            disabled={blockedReason !== null}
            aria-describedby={
              blockedReason ? 'order-import-check-blocked' : undefined
            }
            loading={saving}
            loadingText={t('map.saving')}
            onClick={onContinue}
          >
            {t('check.footer.continue')}
          </LoadingButton>
        </div>
      )}
    </div>
  )
}
