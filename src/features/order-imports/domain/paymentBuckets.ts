import type {
  OrderImportPaymentClass,
  OrderImportPaymentValues,
} from '../api/orderImportsApi'
import { paymentChoice, type MappingForm } from './mappingForm'

export type PaymentBucket = OrderImportPaymentClass

/** One value of the payment column, as a chip in "نؤكدها" or "نتجاهلها". */
export type PaymentChip = {
  /** The normalized value; empty for the blank chip. */
  key: string
  /** The value as the file writes it; empty for the blank chip. */
  label: string
  count: number
  bucket: PaymentBucket
  /** Blank cells follow the store's setting, not this file's choices. */
  blank: boolean
}

export type PaymentBuckets = {
  cod: PaymentChip[]
  notCod: PaymentChip[]
  /** Rows that will be confirmed, as far as payment decides. */
  codRows: number
  excludedRows: number
}

/**
 * The payment column's values split into the two buckets, with live counts.
 * A value the merchant has not decided and the server could not classify
 * starts in "نؤكدها" (cash on delivery is what the merchant imports for).
 * Blank cells are decided by the store's `assumeCodWhenPaymentMissing`.
 */
export function paymentBuckets(
  values: OrderImportPaymentValues,
  form: Pick<MappingForm, 'payment'>,
  assumeCodWhenBlank: boolean
): PaymentBuckets {
  const chips: PaymentChip[] = values.values.map((entry) => ({
    key: entry.normalizedValue,
    label: entry.value,
    count: entry.count,
    bucket:
      paymentChoice(form, entry.normalizedValue, entry.classification) ?? 'cod',
    blank: false,
  }))
  if (values.blankCount > 0)
    chips.push({
      key: '',
      label: '',
      count: values.blankCount,
      bucket: assumeCodWhenBlank ? 'cod' : 'not_cod',
      blank: true,
    })
  const cod = chips.filter((chip) => chip.bucket === 'cod')
  const notCod = chips.filter((chip) => chip.bucket === 'not_cod')
  const rows = (list: PaymentChip[]) =>
    list.reduce((sum, chip) => sum + chip.count, 0)
  return { cod, notCod, codRows: rows(cod), excludedRows: rows(notCod) }
}

/** Tapping a chip moves it to the other bucket. Blank chips do not move. */
export function moveChip(
  form: Pick<MappingForm, 'payment'>,
  chip: PaymentChip
): Pick<MappingForm, 'payment'> {
  if (chip.blank) return { payment: form.payment }
  return {
    payment: {
      ...form.payment,
      [chip.key]: chip.bucket === 'cod' ? 'not_cod' : 'cod',
    },
  }
}
