import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { EXPLAINED_LIFECYCLE_REASONS } from './verificationLifecycle'
import { getLastUpdateAt, resolveRowDescriptionKey } from './verificationRow'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'

const row = (overrides: Partial<VerificationItem>) =>
  ({ status: 'failed', reason: null, ...overrides }) as VerificationItem

describe('resolveRowDescriptionKey', () => {
  it('explains a recorded reason the UI knows', () => {
    expect(resolveRowDescriptionKey(row({ reason: 'missing_currency' }))).toBe(
      'reasons.missing_currency'
    )
    expect(
      resolveRowDescriptionKey(row({ reason: 'non_cod_payment_method' }))
    ).toBe('reasons.non_cod_payment_method')
  })

  it('never shows a raw code for a reason it does not know', () => {
    expect(resolveRowDescriptionKey(row({ reason: 'store_mismatch' }))).toBe(
      'reasons.generic'
    )
  })

  it('falls back to the status description when no reason is recorded', () => {
    expect(resolveRowDescriptionKey(row({ status: 'confirmed' }))).toBe(
      'descriptions.confirmed'
    )
  })
})

describe('getLastUpdateAt', () => {
  it('takes the newest of the update and lifecycle timestamps', () => {
    expect(
      getLastUpdateAt(
        row({
          created_at: '2026-09-16T06:49:00Z',
          updated_at: '2026-09-16T06:50:00Z',
          last_sent_at: '2026-09-16T06:50:00Z',
          confirmed_at: '2026-09-16T07:00:00Z',
        })
      )
    ).toBe('2026-09-16T07:00:00Z')
    expect(
      getLastUpdateAt(
        row({
          created_at: '2026-09-16T06:49:00Z',
          updated_at: '2026-09-17T09:00:00Z',
          confirmed_at: '2026-09-16T07:00:00Z',
        })
      )
    ).toBe('2026-09-17T09:00:00Z')
  })

  it('counts a shipping reply, its Mark done and an open change request', () => {
    const base = {
      created_at: '2026-11-26T17:50:00Z',
      confirmed_at: '2026-11-26T18:12:00Z',
    }
    const shipping = (
      over: Partial<NonNullable<VerificationItem['shipping']>>
    ) =>
      ({
        status: 'read',
        customer_reply: 'address',
        customer_replied_at: '2026-11-27T11:20:00Z',
        resolved_at: null,
        // Tracking-link opens move this one; it is not counted.
        updated_at: '2026-11-28T00:00:00Z',
        ...over,
      }) as VerificationItem['shipping']
    expect(getLastUpdateAt(row({ ...base, shipping: shipping({}) }))).toBe(
      '2026-11-27T11:20:00Z'
    )
    expect(
      getLastUpdateAt(
        row({
          ...base,
          shipping: shipping({ resolved_at: '2026-11-27T13:00:00Z' }),
        })
      )
    ).toBe('2026-11-27T13:00:00Z')
    expect(
      getLastUpdateAt(
        row({
          ...base,
          change_request: {
            opened_at: '2026-11-26T21:02:00Z',
          } as VerificationItem['change_request'],
        })
      )
    ).toBe('2026-11-26T21:02:00Z')
  })

  it('is the order time when nothing has happened yet', () => {
    expect(getLastUpdateAt(row({ created_at: '2026-09-16T06:49:00Z' }))).toBe(
      '2026-09-16T06:49:00Z'
    )
  })

  it('skips values that are not dates, and is null with none', () => {
    expect(
      getLastUpdateAt(
        row({ created_at: '2026-09-16T06:49:00Z', updated_at: 'soon' })
      )
    ).toBe('2026-09-16T06:49:00Z')
    expect(getLastUpdateAt(row({}))).toBeNull()
  })
})

describe('explained reasons', () => {
  it.each([
    ['ar', ar.dashboard.reasons as Record<string, string>],
    ['en', en.dashboard.reasons as Record<string, string>],
  ])('has a sentence for every explained reason in %s', (_locale, reasons) => {
    for (const reason of EXPLAINED_LIFECYCLE_REASONS)
      expect(reasons[reason], reason).toBeTruthy()
    expect(reasons.generic).toBeTruthy()
  })

  it('explains the same reasons in both locales', () => {
    expect(Object.keys(ar.dashboard.reasons).sort()).toEqual(
      Object.keys(en.dashboard.reasons).sort()
    )
  })
})
