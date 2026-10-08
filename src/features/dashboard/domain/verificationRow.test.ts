import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { EXPLAINED_LIFECYCLE_REASONS } from './verificationLifecycle'
import { resolveRowDescriptionKey } from './verificationRow'
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
