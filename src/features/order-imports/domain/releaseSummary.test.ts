import { describe, expect, it } from 'vitest'
import type {
  OrderImportBatchStatus,
  OrderImportLifecycleCounts,
} from '../api/orderImportsApi'
import { pollIntervalFor, RELEASE_POLL_INTERVAL_MS } from './importStep'
import { isSettling, releaseProgress } from './releaseSummary'

function lifecycle(
  counts: Partial<OrderImportLifecycleCounts>
): OrderImportLifecycleCounts {
  return {
    queued: 0,
    sent: 0,
    confirmed: 0,
    canceled: 0,
    noReply: 0,
    failed: 0,
    ...counts,
  }
}

const allReleased = { total: 5, held: 0, released: 5, withdrawn: 0 }

describe('releaseProgress', () => {
  it('does not count orders handed to the queue as sent (bug 3.1)', () => {
    const progress = releaseProgress({
      release: allReleased,
      lifecycle: lifecycle({ queued: 5 }),
    })
    expect(progress).toMatchObject({
      settled: 0,
      delivered: 0,
      queued: 5,
      total: 5,
      percent: 0,
    })
  })

  it('counts failed sends as settled but not delivered', () => {
    const progress = releaseProgress({
      release: allReleased,
      lifecycle: lifecycle({ failed: 5 }),
    })
    expect(progress).toMatchObject({
      settled: 5,
      delivered: 0,
      failed: 5,
      percent: 100,
    })
  })

  it('treats every outcome after sending as delivered', () => {
    const progress = releaseProgress({
      release: { total: 6, held: 1, released: 5, withdrawn: 0 },
      lifecycle: lifecycle({
        queued: 1,
        sent: 1,
        confirmed: 1,
        canceled: 1,
        noReply: 1,
        failed: 1,
      }),
    })
    expect(progress).toMatchObject({
      settled: 5,
      delivered: 4,
      total: 6,
      held: 1,
      percent: 83,
    })
  })

  it('is empty without lifecycle counts', () => {
    expect(releaseProgress({}).percent).toBe(0)
  })
})

describe('isSettling and polling', () => {
  const detail = (status: OrderImportBatchStatus, queued: number) => ({
    status,
    lifecycle: lifecycle({ queued, sent: 5 - queued }),
  })

  it('keeps polling a completed release until every send has an outcome', () => {
    expect(isSettling(detail('completed', 2))).toBe(true)
    expect(pollIntervalFor(detail('completed', 2))).toBe(
      RELEASE_POLL_INTERVAL_MS
    )
  })

  it('stops polling once nothing is queued', () => {
    expect(isSettling(detail('completed', 0))).toBe(false)
    expect(pollIntervalFor(detail('completed', 0))).toBe(false)
  })

  it('does not treat a held, unstarted import as settling', () => {
    expect(isSettling(detail('awaiting_start', 5))).toBe(false)
    expect(pollIntervalFor(detail('awaiting_start', 5))).toBe(false)
  })

  it('polls a releasing batch', () => {
    expect(pollIntervalFor(detail('releasing', 5))).toBe(
      RELEASE_POLL_INTERVAL_MS
    )
  })
})
