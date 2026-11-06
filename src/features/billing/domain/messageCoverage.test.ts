import { describe, expect, it } from 'vitest'
import { coverageRates, messageCoverage } from './messageCoverage'
import { ownNumberAllowance } from './planPresentation'

const price = {
  unitPriceMinor: 100,
  messagePriceMinor: 200,
  creditsPerMessage: 2,
  currency: 'EGP',
}

describe('message coverage', () => {
  it('reads both rates from the server price', () => {
    expect(coverageRates({ ...price, ownNumberCreditsPerMessage: 1 })).toEqual({
      akeed: 2,
      ownNumber: 1,
    })
  })

  it('has no rates while an older backend sends no own-number rate', () => {
    expect(coverageRates(price)).toBeNull()
    expect(
      coverageRates({ ...price, ownNumberCreditsPerMessage: 0 })
    ).toBeNull()
  })

  it('counts whole messages from either number for the same credits', () => {
    const rates = { akeed: 2, ownNumber: 1 }
    expect(messageCoverage(500, rates)).toEqual({ akeed: 250, ownNumber: 500 })
    expect(messageCoverage(201, rates)).toEqual({ akeed: 100, ownNumber: 201 })
    expect(messageCoverage(-5, rates)).toEqual({ akeed: 0, ownNumber: 0 })
  })
})

describe('own-number plan allowance', () => {
  const plan = { ownNumberIncludedVerifications: 900 }

  it('shows the pool while the own number is offered', () => {
    expect(
      ownNumberAllowance(plan, { visible: true, connected: false })
    ).toEqual({ messages: 900, connected: false })
    expect(
      ownNumberAllowance(plan, { visible: true, connected: true })
    ).toEqual({ messages: 900, connected: true })
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
