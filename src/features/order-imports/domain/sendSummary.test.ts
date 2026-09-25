import { describe, expect, it } from 'vitest'
import type { OrderImportRow } from '../api/orderImportsApi'
import {
  hoursLeftToStart,
  isCleanFile,
  isPaymentReason,
  skipGroups,
  skipReasonOf,
} from './sendSummary'

function row(
  rowNumber: number,
  outcome: OrderImportRow['outcome'],
  ...codes: string[]
): OrderImportRow {
  return {
    rowNumber,
    raw: {},
    normalized: null,
    outcome,
    issues: codes.map((code) => ({ code })),
    includeOverride: false,
    collapsedInto: null,
  }
}

describe('skipReasonOf', () => {
  it('reads the reason from the outcome, then the first issue', () => {
    expect(skipReasonOf(row(2, 'invalid', 'PHONE_INVALID'))).toBe('invalid')
    expect(skipReasonOf(row(3, 'duplicate', 'ALREADY_IMPORTED'))).toBe(
      'duplicate'
    )
    expect(skipReasonOf(row(4, 'excluded', 'PAYMENT_NOT_COD'))).toBe('notCod')
    expect(skipReasonOf(row(5, 'excluded', 'ORDER_TOO_OLD'))).toBe('tooOld')
    expect(skipReasonOf(row(6, 'ready'))).toBeNull()
  })

  it('skips informational issues', () => {
    const informational: OrderImportRow = {
      ...row(7, 'excluded', 'PAYMENT_UNKNOWN_EXCLUDED'),
      issues: [
        { code: 'FIELD_TOO_LONG', informational: true },
        { code: 'PAYMENT_UNKNOWN_EXCLUDED' },
      ],
    }
    expect(skipReasonOf(informational)).toBe('noPayment')
  })
})

describe('skipGroups', () => {
  it('says a repeated reason once, largest group first', () => {
    const groups = skipGroups([
      row(2, 'excluded', 'PAYMENT_NOT_COD'),
      row(3, 'invalid', 'PHONE_INVALID'),
      row(4, 'excluded', 'PAYMENT_NOT_COD'),
      row(5, 'excluded', 'PAYMENT_NOT_COD'),
      row(6, 'ready'),
    ])
    expect(groups).toEqual([
      { reason: 'notCod', count: 3, rowNumbers: [2, 4, 5] },
      { reason: 'invalid', count: 1, rowNumbers: [3] },
    ])
    expect(isPaymentReason('notCod')).toBe(true)
    expect(isPaymentReason('invalid')).toBe(false)
  })
})

describe('isCleanFile', () => {
  it('is clean only with no errors and no duplicates', () => {
    expect(isCleanFile({ ready: 5, excluded: 4 })).toBe(true)
    expect(isCleanFile({ ready: 5, invalid: 1 })).toBe(false)
    expect(isCleanFile({ ready: 5, duplicate: 2 })).toBe(false)
  })
})

describe('hoursLeftToStart', () => {
  const now = new Date('2026-09-25T10:00:00Z')

  it('counts down to the draft expiry, then to the start window', () => {
    expect(
      hoursLeftToStart(
        {
          status: 'draft',
          expiresAt: '2026-09-26T09:30:00Z',
          startDeadlineAt: null,
        },
        now
      )
    ).toBe(23)
    expect(
      hoursLeftToStart(
        {
          status: 'awaiting_start',
          expiresAt: '2026-09-26T09:30:00Z',
          startDeadlineAt: '2026-09-28T10:00:00Z',
        },
        now
      )
    ).toBe(72)
  })

  it('never goes below zero and is null without a deadline', () => {
    expect(
      hoursLeftToStart(
        {
          status: 'awaiting_start',
          expiresAt: '2026-09-20T00:00:00Z',
          startDeadlineAt: '2026-09-20T00:00:00Z',
        },
        now
      )
    ).toBe(0)
    expect(
      hoursLeftToStart(
        { status: 'awaiting_start', expiresAt: '', startDeadlineAt: null },
        now
      )
    ).toBeNull()
  })
})
