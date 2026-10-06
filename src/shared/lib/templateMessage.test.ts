import { describe, expect, it } from 'vitest'
import {
  fillTemplateLines,
  templateReplyTone,
  type TemplateMessage,
} from './templateMessage'

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

describe('templateReplyTone', () => {
  it('reads the first reply as confirm and the rest as cancel', () => {
    expect([0, 1, 2].map(templateReplyTone)).toEqual([
      'confirm',
      'cancel',
      'cancel',
    ])
  })
})
