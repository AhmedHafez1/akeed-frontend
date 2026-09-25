import { describe, expect, it } from 'vitest'
import type {
  OrderImportLifecycleCounts,
  OrderImportStartedBatch,
} from '../api/orderImportsApi'
import { followedImport, importProgressChip } from './importProgress'

const lifecycle = (
  counts: Partial<OrderImportLifecycleCounts>
): OrderImportLifecycleCounts => ({
  queued: 0,
  sent: 0,
  confirmed: 0,
  canceled: 0,
  noReply: 0,
  failed: 0,
  ...counts,
})

const batch = (
  batchId: string,
  status: OrderImportStartedBatch['status']
): OrderImportStartedBatch => ({
  batchId,
  fileName: `${batchId}.csv`,
  status,
  startedAt: null,
})

describe('followedImport', () => {
  it('follows one still sending before a newer finished one', () => {
    expect(
      followedImport([batch('new', 'completed'), batch('old', 'releasing')])
        ?.batchId
    ).toBe('old')
  })

  it('falls back to the newest, and to nothing', () => {
    expect(
      followedImport([batch('a', 'completed'), batch('b', 'completed')])
        ?.batchId
    ).toBe('a')
    expect(followedImport([])).toBeNull()
  })
})

describe('importProgressChip', () => {
  it('counts sends with an outcome while releasing', () => {
    expect(
      importProgressChip({
        status: 'releasing',
        lifecycle: lifecycle({ queued: 3, sent: 1, failed: 1 }),
      })
    ).toEqual({ kind: 'sending', settled: 2, total: 5 })
  })

  it('keeps sending while a completed batch still has sends in flight (bug 3.1)', () => {
    expect(
      importProgressChip({
        status: 'completed',
        lifecycle: lifecycle({ queued: 5 }),
      })
    ).toEqual({ kind: 'sending', settled: 0, total: 5 })
  })

  it('reports a pause', () => {
    expect(
      importProgressChip({
        status: 'paused',
        lifecycle: lifecycle({ queued: 4, confirmed: 1 }),
      })
    ).toEqual({ kind: 'paused', settled: 1, total: 5 })
  })

  it('says what reached WhatsApp and what failed once settled', () => {
    expect(
      importProgressChip({
        status: 'completed',
        lifecycle: lifecycle({ sent: 2, confirmed: 2, failed: 1 }),
      })
    ).toEqual({ kind: 'done', delivered: 4, failed: 1, total: 5 })
  })

  it('has nothing to say before the start', () => {
    expect(importProgressChip({ status: 'awaiting_start' })).toBeNull()
  })
})
