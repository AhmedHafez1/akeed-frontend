import { describe, expect, it } from 'vitest'
import { resolveCustomerRecord } from './customerRecord'

const history = (
  other_orders: number,
  confirmed: number,
  canceled: number,
  no_reply = 0
) => ({ other_orders, confirmed, canceled, no_reply })

describe('resolveCustomerRecord', () => {
  it('is nothing for a row with no history', () => {
    expect(resolveCustomerRecord(null)).toBeNull()
    expect(resolveCustomerRecord(undefined)).toBeNull()
  })

  it('reads a first order as a new customer', () => {
    expect(resolveCustomerRecord(history(0, 0, 0))?.kind).toBe('new')
  })

  it('reads mostly confirmed orders as a repeat customer', () => {
    expect(resolveCustomerRecord(history(4, 3, 1))).toMatchObject({
      kind: 'repeat',
      confirmed: 3,
      unconfirmed: 1,
    })
  })

  it('flags a customer who let down as many orders as they confirmed', () => {
    expect(resolveCustomerRecord(history(2, 1, 1))?.kind).toBe('risk')
    expect(resolveCustomerRecord(history(3, 0, 1, 2))).toMatchObject({
      kind: 'risk',
      unconfirmed: 3,
    })
  })

  it('reads other orders with no outcome yet as returning', () => {
    expect(resolveCustomerRecord(history(2, 0, 0))?.kind).toBe('returning')
  })
})
