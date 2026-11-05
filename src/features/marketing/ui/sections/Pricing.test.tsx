import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMarketing } from '@/features/marketing/ui/marketingTestUtils'
import ar from '../../../../../public/messages/ar.json'
import en from '../../../../../public/messages/en.json'
import Pricing from './Pricing'

const own = en.pricing_credits.own_number
const text = () => document.body.textContent ?? ''

describe('Pricing', () => {
  it('shows only the credit model while the own-number promotion is off', () => {
    renderMarketing(<Pricing showOwnNumber={false} />, 'en')

    expect(screen.getByText('per credit')).toBeTruthy()
    expect(text()).toContain('Covers 125–250 orders')
    expect(text()).not.toContain(own.from_yours)
    expect(text()).not.toContain(own.meta_note)
    expect(text()).not.toContain(own.fact_title)
    expect(text()).not.toContain("messages from Akeed's number")
    expect(
      screen.getByRole('link', { name: /See plans on Shopify/ })
    ).toBeTruthy()
  })

  it('defaults to the public switch, which is off in tests', () => {
    renderMarketing(<Pricing />, 'en')
    expect(text()).not.toContain(own.from_yours)
  })

  it('puts the own-number rate beside Akeed’s, with Meta’s charge disclosed', () => {
    renderMarketing(<Pricing showOwnNumber />, 'en')

    expect(screen.getByText(own.from_akeed)).toBeTruthy()
    expect(screen.getByText(own.from_yours)).toBeTruthy()
    expect(text()).toMatch(/2 credits · EGP\s?2/)
    expect(text()).toMatch(/1 credit · EGP\s?1/)
    expect(screen.getByText(own.saving)).toBeTruthy()
    expect(screen.getByText(own.meta_note)).toBeTruthy()
    expect(screen.getByText(own.fact_title)).toBeTruthy()
  })

  it('quotes both coverage figures for the slider amount instead of orders', () => {
    renderMarketing(<Pricing showOwnNumber />, 'en')

    expect(text()).toContain("About 250 messages from Akeed's number")
    expect(text()).toContain('or 500 from your own number')
    expect(text()).not.toContain('Covers 125–250 orders')
  })

  it('lists each Shopify plan as two separate allowances', () => {
    renderMarketing(<Pricing showOwnNumber />, 'en')

    for (const [akeed, ownCount] of [
      ['30', '90'],
      ['300', '900'],
      ['1,000', '3,000'],
      ['2,500', '7,500'],
    ]) {
      expect(text()).toContain(`${akeed} messages from Akeed's number`)
      expect(text()).toContain(`${ownCount} more from your own number`)
    }
    expect(screen.getByText('One-time')).toBeTruthy()
    expect(screen.getAllByText('Every month')).toHaveLength(3)
    expect(screen.getByText(own.shopify_note)).toBeTruthy()
    expect(screen.getByText('Scale')).toBeTruthy()
  })

  it('renders the promotion in Arabic', () => {
    renderMarketing(<Pricing showOwnNumber />, 'ar')

    const arOwn = ar.pricing_credits.own_number
    expect(screen.getByText(arOwn.from_yours)).toBeTruthy()
    expect(screen.getByText(arOwn.meta_note)).toBeTruthy()
    expect(screen.getByText(arOwn.shopify_note)).toBeTruthy()
  })
})
