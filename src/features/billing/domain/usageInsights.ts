import type { PurchaseSummary } from './billing.types'
import type { Transaction } from './transactions'

/** The mini chart on the balance card: today and the 13 days before it. */
export const USAGE_CHART_DAYS = 14

const DAY_MS = 86_400_000

function startOfLocalDay(date: Date, offsetDays = 0) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + offsetDays
  ).getTime()
}

/**
 * How far back the billing page needs the ledger: the whole current month for
 * the usage total, and the chart's 14 days, which reach into last month until
 * the 14th.
 */
export function usageWindowStart(now: Date = new Date()): number {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return Math.min(monthStart, startOfLocalDay(now, 1 - USAGE_CHART_DAYS))
}

/**
 * Whole days the balance lasts at this month's daily average. Today counts as
 * an elapsed day, so the 1st divides by one rather than by zero. `null` when
 * there is nothing to project: no usage yet, or no balance left.
 */
export function runwayDays(
  balance: number,
  usedThisMonth: number,
  now: Date = new Date()
): number | null {
  if (balance <= 0 || usedThisMonth <= 0) return null
  return Math.floor(balance / (usedThisMonth / now.getDate()))
}

/**
 * Messages used per local day, oldest first and today last. Days without
 * usage are 0. Only consumption rows count, as in the month total.
 */
export function dailyUsage(
  items: Transaction[],
  now: Date = new Date(),
  days: number = USAGE_CHART_DAYS
): number[] {
  const buckets = new Array<number>(days).fill(0)
  const today = startOfLocalDay(now)

  for (const item of items) {
    if (item.ledgerType !== 'consumption') continue
    const day = startOfLocalDay(new Date(item.createdAt))
    // Rounded, because a daylight-saving change makes one day 23 or 25 hours.
    const daysAgo = Math.round((today - day) / DAY_MS)
    if (daysAgo < 0 || daysAgo >= days) continue
    buckets[days - 1 - daysAgo] += Math.abs(item.quantity)
  }

  return buckets
}

/** The newest purchase that was paid for and still stands. */
export function latestSuccessfulPurchase(
  purchases: PurchaseSummary[]
): PurchaseSummary | null {
  let latest: PurchaseSummary | null = null
  for (const purchase of purchases) {
    if (purchase.status !== 'successful') continue
    if (
      !latest ||
      Date.parse(purchase.createdAt) > Date.parse(latest.createdAt)
    )
      latest = purchase
  }
  return latest
}
