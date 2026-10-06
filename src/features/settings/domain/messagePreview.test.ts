import { describe, expect, it } from 'vitest'
import { formatPlanPrice } from '@/shared/lib/money'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import { buildPreviewLines, templateOpeningLine } from './messagePreview'

const message: TemplateMessage = {
  lines: [
    [{ text: 'أهلًا ' }, { variable: 'customer' }, { text: '،' }],
    [
      { text: 'طلبك رقم #' },
      { variable: 'order' },
      { text: ' من ' },
      { variable: 'store' },
      { text: ' مستني تأكيدك.' },
    ],
    [{ text: 'الإجمالي: ' }, { variable: 'total' }],
  ],
  buttons: ['تأكيد', 'إلغاء'],
  direction: 'rtl',
  source: 'provider',
}
const sample = {
  customer: 'أحمد',
  store: 'Togo_Test_A',
  order: '1009',
  total: 'US$ 599',
}

describe('buildPreviewLines', () => {
  it('splits variables into their own segments', () => {
    const lines = buildPreviewLines(message, sample)
    expect(lines[0]).toEqual([
      { kind: 'text', text: 'أهلًا ' },
      { kind: 'variable', variable: 'customer', text: 'أحمد' },
      { kind: 'text', text: '،' },
    ])
  })

  it('keeps the hash inside the order number island', () => {
    const [, body] = buildPreviewLines(message, sample)
    expect(body).toContainEqual({
      kind: 'variable',
      variable: 'order',
      text: '#1009',
    })
    expect(body[0]).toEqual({ kind: 'text', text: 'طلبك رقم ' })
  })

  it('drops empty lines', () => {
    expect(
      buildPreviewLines(
        { ...message, lines: [...message.lines, [], [{ text: '' }]] },
        sample
      )
    ).toHaveLength(3)
  })

  it('renders the same whatever the message was read from', () => {
    expect(
      buildPreviewLines({ ...message, source: 'registered' }, sample)
    ).toEqual(buildPreviewLines(message, sample))
  })
})

describe('templateOpeningLine', () => {
  it('joins the first two lines with an ellipsis', () => {
    expect(
      templateOpeningLine(
        {
          ...message,
          lines: [message.lines[0], [{ text: 'شكراً لطلبك.' }]],
        },
        sample
      )
    ).toBe('أهلًا أحمد، شكراً لطلبك.…')
  })

  it('cuts long openings at a word boundary', () => {
    const line = templateOpeningLine(message, sample)
    expect(line.endsWith('…')).toBe(true)
    expect(line.length).toBeLessThanOrEqual(49)
  })

  it('is empty for a message without text', () => {
    expect(templateOpeningLine({ ...message, lines: [] }, sample)).toBe('')
  })
})

describe('formatPlanPrice', () => {
  it('renders one LTR token with no bidi marks', () => {
    expect(formatPlanPrice(9.99, 'USD')).toBe('US$ 9.99')
    expect(formatPlanPrice(49.99, 'USD')).toBe('US$ 49.99')
    expect(formatPlanPrice(599, 'USD')).toBe('US$ 599')
    expect(formatPlanPrice(9.99, 'USD')).not.toMatch(/[‎‏؜]/)
  })
})
