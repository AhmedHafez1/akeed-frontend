import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { renderEmbedded } from '../embeddedTestUtils'
import { ConfirmationDetailsModal } from './ConfirmationDetailsModal'

const products = [
  {
    name: 'Cotton shirt',
    quantity: 2,
    unit_price: '125.50',
    options: [{ value: 'Red' }, { value: 'XL' }],
  },
  { name: 'Gift wrap', quantity: 3, unit_price: null, options: [] },
  { name: 'Free sample', quantity: 1, unit_price: '0', options: [] },
]

function renderDetails(
  details: Partial<VerificationItem>,
  locale: 'ar' | 'en' = 'en'
) {
  const verification = {
    id: 'verification-1',
    order_id: 'order-1',
    order_number: '1150',
    customer_name: 'Synthetic Customer',
    customer_phone: '+201000000000',
    total_price: '251.00',
    currency: 'EGP',
    status: 'confirmed',
    reason: null,
    created_at: '2026-11-01T10:00:00Z',
    platform: 'shopify',
    ...details,
  } as VerificationItem
  return renderEmbedded(
    <ConfirmationDetailsModal
      verification={verification}
      timeZone="UTC"
      onClose={vi.fn()}
    />,
    locale
  )
}

describe('ConfirmationDetailsModal order contents', () => {
  it.each([
    ['en', 'Products', 'Delivery address'],
    ['ar', 'المنتجات', 'عنوان التوصيل'],
  ] as const)(
    'shows products and address in %s',
    (locale, productTitle, addressTitle) => {
      renderDetails(
        {
          line_items: products,
          shipping_region: 'Cairo',
          shipping_address: '12 Nile Street\nFloor 3',
        },
        locale
      )
      const items = screen.getByRole('region', { name: productTitle })
      expect(within(items).getByText('Cotton shirt')).toBeTruthy()
      expect(within(items).getByText('Red / XL')).toBeTruthy()
      expect(within(items).getByText('× 2').getAttribute('dir')).toBe('ltr')
      expect(within(items).getAllByRole('listitem')[0].textContent).toContain(
        '251.00'
      )
      expect(
        within(items).getByText('Gift wrap').closest('li')?.textContent
      ).toBe('Gift wrap× 3')
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
        headings.indexOf(
          locale === 'en' ? 'Verification lifecycle' : 'مراحل التأكيد'
        )
      )
    }
  )

  it.each(['products', 'address'] as const)(
    'shows only %s when the other field is missing',
    (field) => {
      renderDetails(
        field === 'products'
          ? { line_items: products }
          : { shipping_address: '12 Nile Street' }
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
    renderDetails(details)
    expect(screen.queryByRole('region', { name: 'Products' })).toBeNull()
    expect(
      screen.queryByRole('region', { name: 'Delivery address' })
    ).toBeNull()
  })

  it('shows a region without a street address', () => {
    renderDetails({ shipping_region: 'Cairo' })
    expect(
      within(
        screen.getByRole('region', { name: 'Delivery address' })
      ).getByText('Cairo')
    ).toBeTruthy()
  })
})
