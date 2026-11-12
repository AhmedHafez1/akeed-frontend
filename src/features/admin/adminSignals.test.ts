import { describe, expect, it } from 'vitest'
import { ADMIN_SIGNALS, signalDetail, signalLabel } from './adminSignals'

const now = new Date('2026-11-12T12:00:00Z')

describe('admin signal labels and facts', () => {
  it('labels every signal the API can report', () => {
    for (const signal of ADMIN_SIGNALS)
      expect(signalLabel(signal)).not.toMatch(/_/)
    expect(signalLabel('something_new')).toBe('Something New')
  })

  it('says how many orders were skipped and why, without customer data', () => {
    expect(
      signalDetail(
        'orders_not_eligible',
        {
          orders_not_eligible: {
            received: 13,
            eligible: 1,
            skipped: 12,
            top_reason: 'non_cod_payment_method',
            top_payment_method: 'manual',
          },
        },
        now
      )
    ).toBe(
      '12 of 13 orders skipped in 24h · top reason: not COD (payment method: manual)'
    )
  })

  it('says which paid plan was lost and how many paid days are left', () => {
    expect(
      signalDetail(
        'paid_store_uninstalled',
        {
          paid_store_uninstalled: {
            plan: 'pro',
            uninstalled_at: '2026-11-12T10:00:00Z',
            paid_through_at: '2026-12-01T00:00:00Z',
          },
        },
        now
      )
    ).toBe('Pro · uninstalled 2h ago · 19 paid days left')
    expect(
      signalDetail(
        'reinstalled_without_plan',
        {
          reinstalled_without_plan: {
            previous_plan: 'pro',
            lost_at: '2026-11-11T10:00:00Z',
            reinstalled_at: '2026-11-11T10:07:00Z',
          },
        },
        now
      )
    ).toBe('Was Pro · reinstalled Nov 11')
  })

  it('gives cheap facts for existing signals and nothing when absent', () => {
    expect(
      signalDetail(
        'failed_verification_rate',
        { failed_verification_rate: { failed: 9, total: 22 } },
        now
      )
    ).toBe('9 of 22 failed in 24h')
    expect(
      signalDetail(
        'credits_low',
        { credits_low: { available: 1, debt: 0 } },
        now
      )
    ).toBe('1 credit left')
    expect(
      signalDetail(
        'orders_not_eligible',
        {
          orders_not_eligible: {
            received: 9,
            eligible: 3,
            skipped: 6,
            top_reason: 'missing_payment_signal',
            top_payment_method: 'unknown',
          },
        },
        now
      )
    ).toBe('6 of 9 orders skipped in 24h · top reason: no payment method')
    expect(signalDetail('auto_confirmation_disabled', {}, now)).toBeNull()
    expect(signalDetail('orders_not_eligible', undefined, now)).toBeNull()
  })
})
