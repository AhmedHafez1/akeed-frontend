import {
  currencyForCountry,
  type OrderCurrency,
} from '@/shared/commerce/orderCommerce'
import {
  orderImportFields,
  type OrderImportDateCheck,
  type OrderImportDateFormat,
  type OrderImportField,
  type OrderImportFieldSuggestion,
  type OrderImportMappingState,
  type OrderImportPaymentClass,
  type OrderImportPaymentValues,
  type OrderImportSampleRow,
  type SaveOrderImportMappingBody,
} from '../api/orderImportsApi'

export const requiredImportFields: ReadonlySet<OrderImportField> = new Set([
  'phone',
  'customerName',
  'amount',
])

/** Required fields first, then the file-order of the dictionary. */
export const orderedImportFields: readonly OrderImportField[] = [
  ...orderImportFields.filter((field) => requiredImportFields.has(field)),
  ...orderImportFields.filter((field) => !requiredImportFields.has(field)),
]

export type MappingForm = {
  columns: Record<OrderImportField, string[]>
  country: string
  currency: OrderCurrency
  dateFormat: OrderImportDateFormat
  /** Keyed by normalized value; only the merchant's or saved choices. */
  payment: Record<string, OrderImportPaymentClass>
}

/** The server's view of the mapped payment and date columns. */
export type MappingChecks = {
  paymentValues: OrderImportPaymentValues | null
  dateFormat: OrderImportDateCheck | null
}

/**
 * A new phone country brings its own currency along, unless the merchant had
 * already picked a currency other than the previous country's.
 */
export function countryChange(
  form: Pick<MappingForm, 'country' | 'currency'>,
  country: string
): Pick<MappingForm, 'country'> & Partial<Pick<MappingForm, 'currency'>> {
  const next = currencyForCountry(country)
  const followsCountry =
    form.currency === currencyForCountry(form.country) ||
    form.currency === 'USD'
  return next && followsCountry ? { country, currency: next } : { country }
}

export function initialMappingForm(
  state: OrderImportMappingState
): MappingForm {
  const columns = Object.fromEntries(
    orderImportFields.map((field) => [field, []])
  ) as unknown as Record<OrderImportField, string[]>
  for (const suggestion of state.suggestions.fields)
    columns[suggestion.field] = [...suggestion.columns]
  const payment: Record<string, OrderImportPaymentClass> = {}
  for (const entry of state.paymentValues?.values ?? [])
    if (entry.classification !== 'unknown')
      payment[entry.normalizedValue] = entry.classification
  return {
    columns,
    country: state.options.country,
    currency: state.options.defaultCurrency,
    dateFormat: state.options.dateFormat,
    payment,
  }
}

/** How a field row explains its column (story AC4). */
export type FieldStatus =
  | 'detected'
  | 'saved'
  | 'chosen'
  | 'attention'
  | 'chooseDateFormat'
  | 'missing'

export function fieldStatus(
  field: OrderImportField,
  suggestion: OrderImportFieldSuggestion | undefined,
  form: MappingForm,
  checks: MappingChecks
): FieldStatus {
  const chosen = form.columns[field]
  if (chosen.length === 0)
    return requiredImportFields.has(field) ? 'attention' : 'missing'
  if (
    field === 'orderDate' &&
    checks.dateFormat?.column === chosen[0] &&
    checks.dateFormat.ambiguous &&
    form.dateFormat === 'auto'
  )
    return 'chooseDateFormat'
  const unchanged =
    suggestion !== undefined && sameColumns(suggestion.columns, chosen)
  if (!unchanged || suggestion.source === 'merchant') return 'chosen'
  if (suggestion.source === 'saved') return 'saved'
  return suggestion.confidence === 'exact' ? 'detected' : 'attention'
}

function sameColumns(a: readonly string[], b: readonly string[]): boolean {
  return (
    a.length === b.length && a.every((column, index) => column === b[index])
  )
}

export type MappingError =
  | 'required'
  | 'duplicateColumn'
  | 'dateFormatRequired'
  | 'paymentUnresolved'

export type MappingErrors = Partial<
  Record<OrderImportField | 'dateFormat' | 'payment', MappingError>
>

/**
 * The checks the page can make before asking the server (AC4): required
 * fields mapped, a column used once, and — for the columns the server has
 * already looked at — a date format when dates are ambiguous and a choice
 * for every unknown payment value. The server re-checks all of it.
 */
export function mappingErrors(
  form: MappingForm,
  checks: MappingChecks
): MappingErrors {
  const errors: MappingErrors = {}
  const owner = new Map<string, OrderImportField>()
  for (const field of orderedImportFields) {
    const columns = form.columns[field]
    if (columns.length === 0) {
      if (requiredImportFields.has(field)) errors[field] = 'required'
      continue
    }
    for (const column of columns) {
      if (owner.has(column)) errors[field] = 'duplicateColumn'
      else owner.set(column, field)
    }
  }
  if (showsDateFormat(form, checks) && form.dateFormat === 'auto')
    errors.dateFormat = 'dateFormatRequired'
  const payment = paymentValuesFor(form, checks)
  if (
    payment?.values.some(
      (entry) =>
        entry.classification === 'unknown' &&
        !form.payment[entry.normalizedValue]
    )
  )
    errors.payment = 'paymentUnresolved'
  return errors
}

/** The date-format choice appears only when the server found ambiguity. */
export function showsDateFormat(
  form: MappingForm,
  checks: MappingChecks
): boolean {
  const column = form.columns.orderDate[0]
  return (
    column !== undefined &&
    checks.dateFormat?.column === column &&
    checks.dateFormat.ambiguous
  )
}

/**
 * The payment values the server counted, while they still describe the
 * mapped payment column. A newly chosen column is counted on save.
 */
export function paymentValuesFor(
  form: MappingForm,
  checks: MappingChecks
): OrderImportPaymentValues | null {
  const column = form.columns.paymentMethod[0]
  return column !== undefined && checks.paymentValues?.column === column
    ? checks.paymentValues
    : null
}

export function paymentChoice(
  form: MappingForm,
  normalizedValue: string,
  classification: OrderImportPaymentClass | 'unknown'
): OrderImportPaymentClass | null {
  return (
    form.payment[normalizedValue] ??
    (classification === 'unknown' ? null : classification)
  )
}

export function toSaveBody(
  form: MappingForm,
  checks: MappingChecks
): SaveOrderImportMappingBody {
  const single = (field: Exclude<OrderImportField, 'customerName'>) =>
    form.columns[field][0] ?? null
  const payment = paymentValuesFor(form, checks)
  return {
    mapping: {
      phone: single('phone'),
      customerName: form.columns.customerName,
      amount: single('amount'),
      orderReference: single('orderReference'),
      currency: single('currency'),
      paymentMethod: single('paymentMethod'),
      orderDate: single('orderDate'),
      city: single('city'),
      address: single('address'),
      notes: single('notes'),
    },
    options: {
      country: form.country,
      defaultCurrency: form.currency,
      dateFormat: form.dateFormat,
      // Only choices for values the merchant was shown; the server keys them.
      paymentValueMap: payment
        ? Object.fromEntries(
            payment.values.flatMap((entry) => {
              const choice = paymentChoice(
                form,
                entry.normalizedValue,
                entry.classification
              )
              return choice ? [[entry.normalizedValue, choice]] : []
            })
          )
        : {},
    },
  }
}

/** Up to two non-empty example values from the chosen columns. */
export function sampleValues(
  rows: readonly OrderImportSampleRow[],
  columns: readonly string[],
  limit = 2
): string[] {
  if (columns.length === 0) return []
  const values: string[] = []
  for (const row of rows) {
    const value = columns
      .map((column) => row.raw[column]?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
    if (value) values.push(value)
    if (values.length === limit) break
  }
  return values
}
