import { describe, expect, it } from 'vitest'
import type { PurchaseSummary } from './billing.types'
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
  it('projects mixed senders from displayed credits, whichever number sent', () => {
    // 124 credits from Akeed and 146 from the merchant's number by the 4th.
    expect(runwayDays(842, 124 + 146, local(11, 4))).toBe(12)
  })

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
  const day = (credits: number, akeed: number, own: number) => ({
    date: '2026-11-04',
    credits,
    akeedCredits: akeed,
    ownNumberCredits: own,
  })

  it('reads mixed senders from the server buckets, each at its own rate', () => {
    // Two Akeed sends (2 each) and three own-number sends (1 each).
    const usage = {
      daily: [...new Array(13).fill(day(0, 0, 0)), day(7, 4, 3)],
    }
    expect(dailyUsage(usage)).toEqual({
      total: [...new Array(13).fill(0), 7],
      akeed: [...new Array(13).fill(0), 4],
      ownNumber: [...new Array(13).fill(0), 3],
    })
  })

  it('keeps a netted refund and a zero-cost fallback as the server counted them', () => {
    const usage = { daily: [day(0, 0, 0), day(1, 0, 1), day(2, 2, 0)] }
    expect(dailyUsage(usage).total).toEqual([0, 1, 2])
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
