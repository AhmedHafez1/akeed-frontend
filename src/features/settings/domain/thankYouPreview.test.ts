import { describe, expect, it } from 'vitest'
import { thankYouPreview, type ThankYouMessagesProps } from './thankYouPreview'

const props: ThankYouMessagesProps = {
  acknowledgment: {
    available: true,
    creditsPerMessage: 2,
    previews: {
      ar: {
        default: {
          confirmed: 'تأكد {{order}} من {{store}}',
          canceled: 'ألغي {{order}}',
        },
        egyptian_v2: { confirmed: 'طلبك {{order}} اتأكد', canceled: null },
      },
      en: {
        default: {
          confirmed: 'Order {{order}} from {{store}} confirmed.',
          canceled: 'Order {{order}} canceled.',
        },
      },
      ur: {},
      es: {},
      fr: {},
      tr: {},
    },
  },
  checked: false,
  onChange: () => {},
  readOnly: false,
  language: 'ar',
  style: 'egyptian_v2',
  sample: { store: 'Nour', order: '123' },
  automaticStyle: false,
}

describe('thank-you previews', () => {
  it('follows the selected style, fills samples, and respects message direction', () => {
    expect(thankYouPreview(props)).toEqual({
      direction: 'rtl',
      confirmed: 'طلبك 123 اتأكد',
      canceled: null,
    })
  })
  it('uses default wording for automatic style or an unknown style', () => {
    const automatic = thankYouPreview({ ...props, automaticStyle: true })
    expect(automatic.confirmed).toBe('تأكد 123 من Nour')
    expect(thankYouPreview({ ...props, style: 'new-style' })).toEqual(automatic)
  })
  it('follows preview language independently of interface language', () => {
    expect(thankYouPreview({ ...props, language: 'en' })).toEqual({
      direction: 'ltr',
      confirmed: 'Order 123 from Nour confirmed.',
      canceled: 'Order 123 canceled.',
    })
  })
})
