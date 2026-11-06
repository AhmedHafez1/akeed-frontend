import { describe, expect, it } from 'vitest'
import { isCompleteCreditUsage } from './creditUsage'
import { usageFixture } from '../../../../test/fixtures/billing-usage'

describe('complete per-message credit usage', () => {
  it('accepts a full mixed-sender snapshot, independent of pack ledger rows', () => {
    expect(isCompleteCreditUsage(usageFixture())).toBe(true)
  })
  it('rejects missing days, repeated days, and inconsistent sender costs', () => {
    const snapshot = usageFixture()
    expect(
      isCompleteCreditUsage({ ...snapshot, daily: snapshot.daily.slice(1) })
    ).toBe(false)
    expect(
      isCompleteCreditUsage({
        ...snapshot,
        daily: snapshot.daily.map(() => snapshot.daily[0]),
      })
    ).toBe(false)
    expect(
      isCompleteCreditUsage({
        ...snapshot,
        daily: snapshot.daily.map((day) => ({ ...day, ownNumberCredits: 50 })),
      })
    ).toBe(false)
  })
})
