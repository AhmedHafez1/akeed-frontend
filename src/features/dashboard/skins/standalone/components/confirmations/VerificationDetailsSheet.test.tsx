import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { renderStandalone } from '../shared/standaloneTestUtils'
import { VerificationDetailsSheet } from './VerificationDetailsSheet'

function verification(
  overrides: Partial<VerificationItem> = {}
): VerificationItem {
  return {
    id: 'ver-1',
    order_id: 'order-1',
    order_number: '1150',
    customer_name: 'Test Customer',
    customer_phone: '+201000000000',
    total_price: '750.00',
    currency: 'EGP',
    status: 'failed',
    reason: null,
    created_at: '2026-10-03T10:00:00Z',
    follow_up_sent_at: null,
    platform: 'easyorders',
    ...overrides,
  } as VerificationItem
}

function renderSheet(item: VerificationItem, lang: 'ar' | 'en') {
  return renderStandalone(
    <VerificationDetailsSheet
      verification={item}
      timeZone="UTC"
      onClose={vi.fn()}
    />,
    lang
  )
}

/** The value next to a label in the facts list. */
function fact(label: string): string | null {
  return screen.getByText(label).parentElement?.querySelector('dd')
    ?.textContent as string | null
}

describe('VerificationDetailsSheet', () => {
  it.each([
    ['en', 'easyorders', 'Order source', 'EasyOrders'],
    ['ar', 'easyorders', 'مصدر الطلب', 'EasyOrders'],
    ['en', 'shopify', 'Order source', 'Shopify'],
    ['en', 'standalone', 'Order source', 'Added in Akeed'],
    ['ar', 'standalone', 'مصدر الطلب', 'أُضيف من أكيد'],
    ['en', 'some_new_platform', 'Order source', 'Another source'],
  ] as const)(
    'names the order source in %s for %s',
    (lang, platform, label, name) => {
      renderSheet(verification({ platform }), lang)

      expect(fact(label)).toBe(name)
    }
  )

  it('leaves the source out when the row does not say', () => {
    renderSheet(verification({ platform: null }), 'en')

    expect(screen.queryByText('Order source')).toBeNull()
  })

  it.each([
    [
      'en',
      'missing_currency',
      'The store currency has not been chosen yet, so this order was not confirmed. Choose it in the store connection settings.',
    ],
    [
      'ar',
      'missing_phone_country',
      'لم تُحدَّد دولة أرقام العملاء بعد، لذلك لم يُؤكَّد هذا الطلب. حدّدها من إعدادات ربط المتجر.',
    ],
    [
      'en',
      'order_phone_country_missing',
      "The customer's phone number has no country code and the order has no billing country, so the number could not be read and no message was sent. Add the country or the full number to the order in your store, and Akeed will check the order again.",
    ],
    [
      'ar',
      'order_currency_unsupported',
      'عملة هذا الطلب غير محدّدة أو لا يدعمها أكيد، لذلك لم تُرسل رسالة.',
    ],
    [
      'en',
      'store_mismatch',
      'Verification could not continue. Review setup or contact support.',
    ],
  ] as const)('explains the reason in %s: %s', (lang, reason, sentence) => {
    renderSheet(verification({ reason }), lang)

    expect(screen.getByText(sentence)).toBeTruthy()
    expect(document.body.textContent).not.toContain(reason)
  })
})
