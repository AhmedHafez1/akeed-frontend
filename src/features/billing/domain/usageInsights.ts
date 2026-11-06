import type { PurchaseSummary } from './billing.types'
import type { CreditUsage } from './creditUsage'

/** The mini chart on the balance card: today and the 13 days before it. */
export const USAGE_CHART_DAYS = 14

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
 * Credits used per day, oldest first and today last, from the server's
 * per-send totals: whichever number each message went from, refunds already
 * netted on the day of the send. Never rebuilt from ledger postings, which
 * record packs rather than sends.
 */
export function dailyUsage(usage: Pick<CreditUsage, 'daily'>): {
  total: number[]
  akeed: number[]
  ownNumber: number[]
} {
  return {
    total: usage.daily.map((day) => day.credits),
    akeed: usage.daily.map((day) => day.akeedCredits),
    ownNumber: usage.daily.map((day) => day.ownNumberCredits),
  }
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
