import type {
  LedgerActorType,
  LedgerEntry,
  LedgerReasonCode,
  LedgerType,
  PurchaseStatus,
  PurchaseSummary,
} from './billing.types'

export type TransactionKind = 'purchase' | 'usage' | 'adjustment'

export interface Transaction {
  id: string
  kind: TransactionKind
  ledgerType: LedgerType
  reasonCode: LedgerReasonCode
  actorType: LedgerActorType
  /** Signed, exactly as the ledger stores it. */
  quantity: number
  balanceAfter: number
  createdAt: string
  /** The purchase reference when one exists; usage entries carry none. */
  reference: string | null
  purchase: PurchaseSummary | null
}

export type TransactionStatus = PurchaseStatus | 'used' | 'posted'

export type PeriodFilter = 'all' | 'thisMonth' | 'last30' | 'last90'

export interface TransactionFilters {
  kind: TransactionKind | 'all'
  status: TransactionStatus | 'all'
  period: PeriodFilter
  query: string
}

export const EMPTY_FILTERS: TransactionFilters = {
  kind: 'all',
  status: 'all',
  period: 'all',
  query: '',
}

const KIND_BY_LEDGER_TYPE: Record<LedgerType, TransactionKind> = {
  purchase: 'purchase',
  free_grant: 'purchase',
  consumption: 'usage',
  chargeback_reinstatement: 'adjustment',
  chargeback_reversal: 'adjustment',
  failure_reversal: 'adjustment',
  refund_reversal: 'adjustment',
  staff_adjustment: 'adjustment',
}

/**
 * One ordered stream from the two endpoints the API exposes.
 *
 * The ledger is the spine: it already contains a row for every purchase grant
 * (`type: 'purchase'`, `reasonCode: 'payment_verified'`) carrying the purchase
 * reference, so joining `PurchaseSummary` by reference adds the money and the
 * settlement status without inventing a second ordering.
 */
export function buildTransactions(
  ledger: LedgerEntry[],
  purchases: PurchaseSummary[]
): Transaction[] {
  const byReference = new Map(
    purchases.map((purchase) => [purchase.reference, purchase])
  )

  return ledger
    .map<Transaction>((entry) => ({
      id: entry.id,
      kind: KIND_BY_LEDGER_TYPE[entry.type] ?? 'adjustment',
      ledgerType: entry.type,
      reasonCode: entry.reasonCode,
      actorType: entry.actorType,
      quantity: entry.quantity,
      balanceAfter: entry.postedBalanceAfter,
      createdAt: entry.createdAt,
      reference: entry.purchaseRef,
      purchase: entry.purchaseRef
        ? (byReference.get(entry.purchaseRef) ?? null)
        : null,
    }))
    .sort(compareNewestFirst)
}

/*
 * The id tiebreak is not cosmetic: several ledger rows are written inside one
 * transaction and therefore share a `created_at`. The server pages on
 * `(created_at, id)` for the same reason, and re-sorting without the tiebreak
 * would shuffle those rows relative to the page boundaries they arrived in.
 */
function compareNewestFirst(a: Transaction, b: Transaction) {
  const delta = Date.parse(b.createdAt) - Date.parse(a.createdAt)
  return delta !== 0 ? delta : b.id.localeCompare(a.id)
}

export function transactionStatus(item: Transaction): TransactionStatus {
  if (item.purchase) return item.purchase.status
  if (item.kind === 'usage') return 'used'
  return 'posted'
}

export function periodStart(period: PeriodFilter, now: Date): number | null {
  switch (period) {
    case 'thisMonth':
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    case 'last30':
      return now.getTime() - 30 * 86_400_000
    case 'last90':
      return now.getTime() - 90 * 86_400_000
    default:
      return null
  }
}

/**
 * `labelOf` resolves the translated text a row shows, so free-text search
 * matches what the merchant can actually read rather than raw enum values.
 * Keeping it as a parameter is what lets this module stay free of next-intl.
 */
export function filterTransactions(
  items: Transaction[],
  filters: TransactionFilters,
  labelOf: (item: Transaction) => string,
  now: Date = new Date()
): Transaction[] {
  const from = periodStart(filters.period, now)
  const needle = filters.query.trim().toLocaleLowerCase()

  return items.filter((item) => {
    if (filters.kind !== 'all' && item.kind !== filters.kind) return false
    if (filters.status !== 'all' && transactionStatus(item) !== filters.status)
      return false
    if (from !== null && Date.parse(item.createdAt) < from) return false
    if (!needle) return true
    const haystack = `${item.reference ?? ''} ${item.id} ${labelOf(item)}`
    return haystack.toLocaleLowerCase().includes(needle)
  })
}

export interface Page<T> {
  rows: T[]
  total: number
  /** 1-based and inclusive; both are 0 when there is nothing to show. */
  from: number
  to: number
  page: number
  pageCount: number
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): Page<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * pageSize
  const rows = items.slice(start, start + pageSize)
  return {
    rows,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + rows.length,
    page: current,
    pageCount,
  }
}

export interface TransactionTotals {
  purchasedTotal: number
  usedThisMonth: number
  count: number
}

export function summarize(
  items: Transaction[],
  now: Date = new Date()
): TransactionTotals {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let purchasedTotal = 0
  let usedThisMonth = 0

  for (const item of items) {
    if (item.kind === 'purchase' && item.quantity > 0) {
      purchasedTotal += item.quantity
    }
    if (
      item.ledgerType === 'consumption' &&
      Date.parse(item.createdAt) >= monthStart
    ) {
      usedThisMonth += Math.abs(item.quantity)
    }
  }

  return { purchasedTotal, usedThisMonth, count: items.length }
}

/**
 * True when the loaded window definitely covers the whole current month, i.e.
 * every consumption entry in it has been seen. Without this check the month
 * total would silently under-report as soon as the drain hit its cap.
 */
export function coversCurrentMonth(
  items: Transaction[],
  isComplete: boolean,
  now: Date = new Date()
): boolean {
  if (isComplete) return true
  const oldest = items.at(-1)
  if (!oldest) return false
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return Date.parse(oldest.createdAt) < monthStart
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Excel decides a CSV's encoding from its first bytes, so the UTF-8 BOM is
 * load-bearing — without it every Arabic column opens as mojibake.
 */
export function toCsv(rows: string[][]): string {
  const body = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  return `﻿${body}`
}
