import { describe, expect, it } from 'vitest'
import { formatPlanPrice } from '@/shared/lib/money'
import { buildPreviewLines, templateOpeningLine } from './messagePreview'

const template = {
  greeting: 'أهلًا {{customer}}،',
  body: 'طلبك رقم #{{order}} من {{store}} مستني تأكيدك.',
  totalLabel: 'الإجمالي: {{total}}',
  ending: '',
  confirmButton: 'تأكيد',
  cancelButton: 'إلغاء',
}
const sample = {
  customer: 'أحمد',
  store: 'Togo_Test_A',
  order: '1009',
  total: 'US$ 599',
}

describe('buildPreviewLines', () => {
  it('splits variables into their own segments', () => {
    const lines = buildPreviewLines(template, sample)
    expect(lines[0]).toEqual([
      { kind: 'text', text: 'أهلًا ' },
      { kind: 'variable', variable: 'customer', text: 'أحمد' },
      { kind: 'text', text: '،' },
    ])
  })

  it('keeps the hash inside the order number island', () => {
    const [, body] = buildPreviewLines(template, sample)
    expect(body).toContainEqual({
      kind: 'variable',
      variable: 'order',
      text: '#1009',
    })
    expect(body[0]).toEqual({ kind: 'text', text: 'طلبك رقم ' })
  })

  it('drops empty blocks', () => {
    expect(buildPreviewLines(template, sample)).toHaveLength(3)
  })
})

describe('templateOpeningLine', () => {
  it('joins the greeting and first body line with an ellipsis', () => {
    expect(
      templateOpeningLine(
        { ...template, body: 'شكراً لطلبك.' },
        { ...sample, customer: 'أحمد' }
      )
    ).toBe('أهلًا أحمد، شكراً لطلبك.…')
  })

  it('cuts long openings at a word boundary', () => {
    const line = templateOpeningLine(template, sample)
    expect(line.endsWith('…')).toBe(true)
    expect(line.length).toBeLessThanOrEqual(49)
  })
})

describe('formatPlanPrice', () => {
  it('renders one LTR token with no bidi marks', () => {
    expect(formatPlanPrice(9.99, 'USD')).toBe('US$ 9.99')
    expect(formatPlanPrice(49.99, 'USD')).toBe('US$ 49.99')
    expect(formatPlanPrice(599, 'USD')).toBe('US$ 599')
    expect(formatPlanPrice(9.99, 'USD')).not.toMatch(/[\u200E\u200F\u061C]/)
  })
})
