import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
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
  const products = [
    {
      name: 'Cotton shirt',
      quantity: 2,
      unit_price: '125.50',
      options: [{ name: 'Colour', value: 'Red' }, { value: 'XL' }],
    },
    { name: 'Gift wrap', quantity: 3, unit_price: null, options: [] },
    { name: 'Free sample', quantity: 1, unit_price: '0', options: [] },
  ]

  it.each([
    ['en', 'Products', 'Delivery address', 'Verification lifecycle'],
    ['ar', 'المنتجات', 'عنوان التوصيل', 'مراحل التأكيد'],
  ] as const)(
    'shows products and a multiline address in %s',
    (locale, productTitle, addressTitle, lifecycleTitle) => {
      renderSheet(
        verification({
          line_items: products,
          shipping_region: 'Cairo',
          shipping_address: '12 Nile Street\nFloor 3',
        }),
        locale
      )

      const items = screen.getByRole('region', { name: productTitle })
      expect(within(items).getByText('Cotton shirt')).toBeTruthy()
      expect(within(items).getByText('Red / XL')).toBeTruthy()
      expect(within(items).getByText('× 2')).toBeTruthy()
      const pricedLine = within(items).getAllByRole('listitem')[0]
      expect(pricedLine.textContent).toContain('251.00')
      expect(pricedLine.textContent).toContain(locale === 'en' ? 'EGP' : 'ج.م')
      const gift = within(items).getByText('Gift wrap').closest('li')!
      expect(gift.textContent).toBe('Gift wrap× 3')
      expect(
        within(items).getByText('Free sample').closest('li')?.textContent
      ).toContain('0.00')

      const address = screen.getByRole('region', { name: addressTitle })
      expect(within(address).getByText('Cairo')).toBeTruthy()
      expect(
        within(address).getByText('12 Nile Street Floor 3').textContent
      ).toBe('12 Nile Street\nFloor 3')
      const headings = screen.getAllByRole('heading').map((n) => n.textContent)
      expect(headings.indexOf(productTitle)).toBeLessThan(
        headings.indexOf(addressTitle)
      )
      expect(headings.indexOf(addressTitle)).toBeLessThan(
        headings.indexOf(lifecycleTitle)
      )
      expect(within(items).getByText('× 2').getAttribute('dir')).toBe('ltr')
    }
  )

  it.each(['products', 'address'] as const)(
    'shows only %s when the other field is missing',
    (field) => {
      renderSheet(
        verification(
          field === 'products'
            ? { line_items: products }
            : { shipping_address: '12 Nile Street' }
        ),
        'en'
      )
      expect(screen.queryByRole('region', { name: 'Products' }) !== null).toBe(
        field === 'products'
      )
      expect(
        screen.queryByRole('region', { name: 'Delivery address' }) !== null
      ).toBe(field === 'address')
    }
  )

  it.each([
    {},
    { line_items: null, shipping_region: null, shipping_address: null },
    { line_items: [], shipping_region: ' ', shipping_address: '\n' },
  ])('hides both sections when details are missing: %j', (details) => {
    renderSheet(verification(details), 'en')
    expect(screen.queryByRole('region', { name: 'Products' })).toBeNull()
    expect(
      screen.queryByRole('region', { name: 'Delivery address' })
    ).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Verification lifecycle' })
    ).toBeTruthy()
  })

  it('shows an available region without inventing a street address', () => {
    renderSheet(verification({ shipping_region: 'Cairo' }), 'en')
    const address = screen.getByRole('region', { name: 'Delivery address' })
    expect(within(address).getByText('Cairo')).toBeTruthy()
    expect(address.textContent).not.toContain('—')
  })

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
