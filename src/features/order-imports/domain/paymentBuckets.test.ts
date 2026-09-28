import { describe, expect, it } from 'vitest'
import type { OrderImportPaymentValues } from '../api/orderImportsApi'
import { moveChip, paymentBuckets } from './paymentBuckets'

const values: OrderImportPaymentValues = {
  column: 'Payment',
  values: [
    {
      value: 'Cash',
      normalizedValue: 'cash',
      count: 3,
      classification: 'cod',
      autoClassification: 'cod',
      source: 'auto',
    },
    {
      value: 'Visa',
      normalizedValue: 'visa',
      count: 2,
      classification: 'not_cod',
      autoClassification: 'not_cod',
      source: 'auto',
    },
    {
      value: 'InstaPay',
      normalizedValue: 'instapay',
      count: 1,
      classification: 'unknown',
      autoClassification: 'unknown',
      source: 'auto',
    },
  ],
  blankCount: 4,
  distinctCount: 3,
  truncated: false,
}

describe('paymentBuckets', () => {
  it('splits values by classification and counts rows live', () => {
    const buckets = paymentBuckets(values, { payment: {} }, false)
    expect(buckets.cod.map((chip) => chip.key)).toEqual(['cash', 'instapay'])
    expect(buckets.notCod.map((chip) => chip.key)).toEqual(['visa', ''])
    expect(buckets.codRows).toBe(4)
    expect(buckets.excludedRows).toBe(6)
  })

  it("puts blank cells where the store's setting says", () => {
    const buckets = paymentBuckets(values, { payment: {} }, true)
    expect(buckets.cod.at(-1)).toMatchObject({ blank: true, count: 4 })
    expect(buckets.codRows).toBe(8)
  })

  it('uses the explicit blank choice before the store setting', () => {
    const buckets = paymentBuckets(
      values,
      { payment: {}, blankPayment: 'cod' },
      false
    )
    expect(buckets.cod.at(-1)).toMatchObject({ blank: true, count: 4 })
    expect(buckets.codRows).toBe(8)
  })

  it("lets the merchant's choice win over the server's", () => {
    const buckets = paymentBuckets(
      values,
      { payment: { cash: 'not_cod' } },
      false
    )
    expect(buckets.notCod.map((chip) => chip.key)).toContain('cash')
  })

  it('omits the blank chip when every row has a value', () => {
    const buckets = paymentBuckets(
      { ...values, blankCount: 0 },
      { payment: {} },
      false
    )
    expect(buckets.notCod.some((chip) => chip.blank)).toBe(false)
  })
})

describe('moveChip', () => {
  it('moves a chip to the other bucket and back', () => {
    const start = paymentBuckets(values, { payment: {} }, false)
    const cash = start.cod[0]
    const moved = moveChip({ payment: {} }, cash)
    expect(moved.payment.cash).toBe('not_cod')
    const after = paymentBuckets(values, moved, false)
    expect(after.codRows).toBe(1)
    expect(after.excludedRows).toBe(9)
    const back = moveChip(moved, after.notCod.find((c) => c.key === 'cash')!)
    expect(back.payment.cash).toBe('cod')
  })

  it('moves the blank chip between buckets and back', () => {
    const blank = paymentBuckets(values, { payment: {} }, false).notCod.find(
      (chip) => chip.blank
    )!
    const moved = moveChip({ payment: {} }, blank)
    expect(moved.blankPayment).toBe('cod')
    expect(paymentBuckets(values, moved, false).codRows).toBe(8)

    const movedBack = moveChip(
      moved,
      paymentBuckets(values, moved, false).cod.find((chip) => chip.blank)!
    )
    expect(movedBack.blankPayment).toBe('not_cod')
  })
})
