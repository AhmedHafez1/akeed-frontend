import { describe, expect, it } from 'vitest'
import {
  TEMPLATE_DETAIL_SAMPLES,
  fillTemplateLines,
  templateReplyTone,
  type TemplateMessage,
} from './templateMessage'
import { templateMessageFixture } from './templateMessageFixture'

const message: TemplateMessage = {
  lines: [
    [{ text: 'Hi ' }, { variable: 'customer' }, { text: '!' }],
    [
      { text: 'Order #' },
      { variable: 'order' },
      { text: ' for ' },
      { variable: 'total' },
    ],
    [{ text: '  ' }],
  ],
  buttons: ['Confirm', 'Cancel'],
  direction: 'ltr',
  source: 'registered',
}

describe('fillTemplateLines', () => {
  it('fills each value and drops blank lines', () => {
    expect(
      fillTemplateLines(message, {
        customer: 'Ahmed',
        store: 'Nour',
        order: '1009',
        total: 'USD 599.00',
      })
    ).toEqual(['Hi Ahmed!', 'Order #1009 for USD 599.00'])
  })

  it('does not double a hash the value already carries', () => {
    expect(
      fillTemplateLines(message, {
        customer: 'Ahmed',
        store: 'Nour',
        order: '#TEST-1',
        total: '250',
      })[1]
    ).toBe('Order #TEST-1 for 250')
  })
})

describe('a template that shows the order', () => {
  const values = {
    customer: 'Ahmed',
    store: 'Nour',
    order: '44',
    total: 'EGP 440.00',
  }
  const detailed = (direction: 'ltr' | 'rtl') =>
    templateMessageFixture(
      ['Cart Items: {{items}}', 'Region: {{region}}', 'Address: {{address}}'],
      ['Confirm', 'Cancel'],
      { direction }
    )

  it('shows the sample order of its language when a preview gives none', () => {
    expect(fillTemplateLines(detailed('ltr'), values)).toEqual([
      `Cart Items: ${TEMPLATE_DETAIL_SAMPLES.ltr.items}`,
      'Region: Cairo',
      'Address: 12 Nile Street, Maadi',
    ])
    expect(fillTemplateLines(detailed('rtl'), values)[1]).toBe(
      `Region: ${TEMPLATE_DETAIL_SAMPLES.rtl.region}`
    )
  })

  it('uses the order details a preview gives', () => {
    expect(
      fillTemplateLines(detailed('ltr'), {
        ...values,
        items: '1. Lunch box (1x 180) = 180',
        region: 'Giza',
        address: '5 Pyramid Road',
      })
    ).toEqual([
      'Cart Items: 1. Lunch box (1x 180) = 180',
      'Region: Giza',
      'Address: 5 Pyramid Road',
    ])
  })

  it('keeps every sample on one line, as a send does', () => {
    for (const samples of Object.values(TEMPLATE_DETAIL_SAMPLES)) {
      for (const sample of Object.values(samples)) {
        expect(sample).not.toMatch(/[\r\n\t]/)
      }
    }
  })
})

describe('templateReplyTone', () => {
  it('reads the first reply as confirm and the rest as cancel', () => {
    expect([0, 1, 2].map(templateReplyTone)).toEqual([
      'confirm',
      'cancel',
      'cancel',
    ])
  })
})
