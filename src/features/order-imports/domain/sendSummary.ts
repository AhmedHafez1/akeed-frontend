import type {
  OrderImportBatchDetail,
  OrderImportRow,
} from '../api/orderImportsApi'

/** Why rows stay out of the import, one line per reason in the send step. */
export type SkipReason =
  | 'notCod'
  | 'noPayment'
  | 'tooOld'
  | 'possibleDuplicate'
  | 'duplicate'
  | 'invalid'
  | 'excluded'

export type SkipGroup = {
  reason: SkipReason
  count: number
  /** Rows for this reason; the line expands to them. */
  rowNumbers: number[]
}

const EXCLUDED_REASONS: Readonly<Record<string, SkipReason>> = {
  PAYMENT_NOT_COD: 'notCod',
  PAYMENT_UNKNOWN_EXCLUDED: 'noPayment',
  ORDER_TOO_OLD: 'tooOld',
  POSSIBLE_DUPLICATE: 'possibleDuplicate',
}

/** The one reason a row is left out, from its outcome and first issue. */
export function skipReasonOf(row: OrderImportRow): SkipReason | null {
  if (row.outcome === 'invalid') return 'invalid'
  if (row.outcome === 'duplicate') return 'duplicate'
  if (row.outcome !== 'excluded') return null
  for (const issue of row.issues) {
    if (issue.informational) continue
    const reason = EXCLUDED_REASONS[issue.code]
    if (reason) return reason
  }
  return 'excluded'
}

/**
 * "4 مستبعدة لأنها مدفوعة مسبقًا": rows grouped by why they stay out, the
 * largest group first, so a repeated reason is said once.
 */
export function skipGroups(rows: readonly OrderImportRow[]): SkipGroup[] {
  const groups = new Map<SkipReason, SkipGroup>()
  for (const row of rows) {
    const reason = skipReasonOf(row)
    if (!reason) continue
    const group = groups.get(reason) ?? { reason, count: 0, rowNumbers: [] }
    group.count += 1
    group.rowNumbers.push(row.rowNumber)
    groups.set(reason, group)
  }
  return [...groups.values()].sort((a, b) => b.count - a.count)
}

/** Reasons the payment classification in step 2 decided. */
export function isPaymentReason(reason: SkipReason): boolean {
  return reason === 'notCod' || reason === 'noPayment'
}

/** "لا تكرار ولا أخطاء" is only true when neither count is above zero. */
export function isCleanFile(counts: OrderImportBatchDetail['counts']): boolean {
  return (counts.invalid ?? 0) === 0 && (counts.duplicate ?? 0) === 0
}

/**
 * Whole hours left to start before these orders lapse: a draft expires, an
 * imported batch has a start window. Null when neither applies.
 */
export function hoursLeftToStart(
  detail: Pick<
    OrderImportBatchDetail,
    'status' | 'expiresAt' | 'startDeadlineAt'
  >,
  now: Date
): number | null {
  const deadline =
    detail.status === 'draft' ? detail.expiresAt : detail.startDeadlineAt
  if (!deadline) return null
  const ms = Date.parse(deadline) - now.getTime()
  if (!Number.isFinite(ms)) return null
  return Math.max(0, Math.floor(ms / 3_600_000))
}
