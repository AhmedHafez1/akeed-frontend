import { describe, expect, it } from 'vitest'
import type { PurchaseSummary } from './billing.types'
import type { Transaction } from './transactions'
import {
  dailyUsage,
  latestSuccessfulPurchase,
  runwayDays,
  usageWindowStart,
} from './usageInsights'

/** Local wall-clock dates, so the suite passes in any time zone. */
function local(month: number, day: number, hour = 12, minute = 0) {
  return new Date(2026, month - 1, day, hour, minute)
}

let sequence = 0
function entry(
  at: Date,
  quantity: number,
  ledgerType: Transaction['ledgerType'] = 'consumption'
): Transaction {
  sequence += 1
  return {
    id: `entry-${sequence}`,
    kind: ledgerType === 'consumption' ? 'usage' : 'purchase',
    ledgerType,
    reasonCode: 'message_accepted',
    actorType: 'system',
    quantity,
    balanceAfter: 0,
    createdAt: at.toISOString(),
    reference: null,
    purchase: null,
  }
}

function purchase(
  reference: string,
  status: PurchaseSummary['status'],
  createdAt: Date
): PurchaseSummary {
  return {
    reference,
    status,
    disputeStatus: 'none',
    quantity: 500,
    unitPriceMinor: 200,
    totalMinor: 100_000,
    currency: 'EGP',
    refundedMinor: 0,
    reconciliationRequired: false,
    checkoutExpiresAt: null,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
  }
}

describe('runwayDays', () => {
  it('divides the balance by the daily average so far this month', () => {
    // 212 used over 20 days is 10.6 a day; 388 lasts 36.6 days.
    expect(runwayDays(388, 212, local(10, 20))).toBe(36)
  })

  it('has nothing to project without usage this month', () => {
    expect(runwayDays(388, 0, local(10, 20))).toBeNull()
  })

  it('counts the 1st as one elapsed day', () => {
    expect(runwayDays(100, 20, local(10, 1, 0, 5))).toBe(5)
  })

  it('has no runway on an empty balance', () => {
    expect(runwayDays(0, 212, local(10, 20))).toBeNull()
  })

  it('rounds down to zero when the balance lasts less than a day', () => {
    expect(runwayDays(5, 300, local(10, 10))).toBe(0)
  })
})

describe('dailyUsage', () => {
  const now = local(10, 20, 15)

  it('returns 14 zero days when nothing was used', () => {
    expect(dailyUsage([], now)).toEqual(new Array(14).fill(0))
  })

  it('puts today last and 13 days ago first', () => {
    const buckets = dailyUsage(
      [entry(local(10, 20, 9), -3), entry(local(10, 7, 9), -2)],
      now
    )
    expect(buckets).toHaveLength(14)
    expect(buckets[13]).toBe(3)
    expect(buckets[0]).toBe(2)
  })

  it('splits days at local midnight', () => {
    const buckets = dailyUsage(
      [
        entry(local(10, 19, 23, 59), -1),
        entry(local(10, 20, 0, 0), -1),
        entry(local(10, 20, 14), -1),
      ],
      now
    )
    expect(buckets[12]).toBe(1)
    expect(buckets[13]).toBe(2)
  })

  it('leaves out rows older than the window', () => {
    const buckets = dailyUsage([entry(local(10, 6, 23, 59), -9)], now)
    expect(buckets.every((value) => value === 0)).toBe(true)
  })

  it('counts consumption only', () => {
    const buckets = dailyUsage(
      [
        entry(local(10, 20, 9), 500, 'purchase'),
        entry(local(10, 20, 9), 1, 'failure_reversal'),
        entry(local(10, 20, 9), -4),
      ],
      now
    )
    expect(buckets[13]).toBe(4)
  })

  it('reaches into the previous month early in the month', () => {
    const buckets = dailyUsage(
      [entry(local(9, 30, 10), -6), entry(local(10, 1, 10), -2)],
      local(10, 1, 18)
    )
    expect(buckets[12]).toBe(6)
    expect(buckets[13]).toBe(2)
  })
})

describe('usageWindowStart', () => {
  it('goes back 13 days before today early in the month', () => {
    expect(usageWindowStart(local(10, 1, 18))).toBe(
      local(9, 18, 0, 0).getTime()
    )
  })

  it('goes back to the 1st once the chart fits inside the month', () => {
    expect(usageWindowStart(local(10, 20, 18))).toBe(
      local(10, 1, 0, 0).getTime()
    )
  })
})

describe('latestSuccessfulPurchase', () => {
  it('is null when nothing was bought', () => {
    expect(latestSuccessfulPurchase([])).toBeNull()
  })

  it('skips purchases that did not succeed or were refunded', () => {
    const result = latestSuccessfulPurchase([
      purchase('akd_pending', 'pending', local(10, 19)),
      purchase('akd_refunded', 'refunded', local(10, 18)),
      purchase('akd_paid', 'successful', local(9, 12)),
      purchase('akd_older', 'successful', local(8, 2)),
    ])
    expect(result?.reference).toBe('akd_paid')
  })
})
