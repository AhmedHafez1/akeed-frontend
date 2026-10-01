import { describe, expect, it } from 'vitest'
import { coversSince, type Transaction } from './transactions'

function entryAt(createdAt: string): Transaction {
  return {
    id: createdAt,
    kind: 'usage',
    ledgerType: 'consumption',
    reasonCode: 'message_accepted',
    actorType: 'system',
    quantity: -1,
    balanceAfter: 0,
    createdAt,
    reference: null,
    purchase: null,
  }
}

const since = Date.parse('2026-09-18T00:00:00.000Z')
// Newest first, as the ledger arrives.
const newest = entryAt('2026-10-01T09:00:00.000Z')
const inWindow = entryAt('2026-09-20T09:00:00.000Z')
const beforeWindow = entryAt('2026-09-17T23:59:59.000Z')

describe('coversSince', () => {
  it('is not covered while the oldest loaded row is still inside the window', () => {
    expect(coversSince([newest, inWindow], false, since)).toBe(false)
  })

  it('is covered once a loaded row predates the window', () => {
    expect(coversSince([newest, inWindow, beforeWindow], false, since)).toBe(
      true
    )
  })

  it('is covered when the feed is exhausted, however short it is', () => {
    expect(coversSince([newest], true, since)).toBe(true)
    expect(coversSince([], true, since)).toBe(true)
  })

  it('is not covered before anything has loaded', () => {
    expect(coversSince([], false, since)).toBe(false)
  })
})
