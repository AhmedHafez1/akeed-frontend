import { describe, expect, it } from 'vitest'
import { coverageRates, messageCoverage } from './messageCoverage'
import { ownNumberAllowance } from './planPresentation'

const price = {
  unitPriceMinor: 50,
  messagePriceMinor: 100,
  creditsPerMessage: 2,
  currency: 'EGP',
}

describe('message coverage', () => {
  it('reads both message prices from the server', () => {
    expect(
      coverageRates({
        ...price,
        ownNumberCreditsPerMessage: 1,
        akeedMessagePriceMinor: 100,
        ownNumberMessagePriceMinor: 50,
      })
    ).toEqual({ akeed: 100, ownNumber: 50 })
  })

  it('derives them from the credit rates of an older backend', () => {
    expect(coverageRates({ ...price, ownNumberCreditsPerMessage: 1 })).toEqual({
      akeed: 100,
      ownNumber: 50,
    })
  })

  it('has no rates while an older backend sends no own-number rate', () => {
    expect(coverageRates(price)).toBeNull()
    expect(
      coverageRates({ ...price, ownNumberCreditsPerMessage: 0 })
    ).toBeNull()
  })

  it('counts whole messages from either number for the same money', () => {
    const rates = { akeed: 100, ownNumber: 50 }
    expect(messageCoverage(25000, rates)).toEqual({
      akeed: 250,
      ownNumber: 500,
    })
    expect(messageCoverage(10050, rates)).toEqual({
      akeed: 100,
      ownNumber: 201,
    })
    expect(messageCoverage(-5, rates)).toEqual({ akeed: 0, ownNumber: 0 })
  })
})

describe('own-number plan allowance', () => {
  const plan = { ownNumberIncludedVerifications: 1000 }

  it('shows the pool while the own number is offered', () => {
    expect(
      ownNumberAllowance(plan, { visible: true, connected: false })
    ).toEqual({ messages: 1000, connected: false })
    expect(
      ownNumberAllowance(plan, { visible: true, connected: true })
    ).toEqual({ messages: 1000, connected: true })
  })

  it('hides it while not offered, still loading, or missing from the API', () => {
    expect(
      ownNumberAllowance(plan, { visible: false, connected: false })
    ).toBeNull()
    expect(ownNumberAllowance(plan, null)).toBeNull()
    expect(
      ownNumberAllowance({}, { visible: true, connected: false })
    ).toBeNull()
  })
})
