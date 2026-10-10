import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMarketing } from '@/features/marketing/ui/marketingTestUtils'
import type { StartRoute } from '@/shared/config/commerceSources'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import Sources from './Sources'

const SHOPIFY: StartRoute = { id: 'shopify', kind: 'external' }
const WOOCOMMERCE: StartRoute = { id: 'woocommerce', kind: 'signup' }
const EASYORDERS: StartRoute = { id: 'easyorders', kind: 'signup' }
const STANDALONE: StartRoute = { id: 'standalone', kind: 'signup' }

const cards = () =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>('#sources a'))

describe('Sources', () => {
  it.each([
    ['en', 'Where do your orders come from?', 'No connected store'],
    ['ar', 'من أين تأتي طلباتك؟', 'بدون متجر مربوط'],
  ] as const)(
    'shows one card per start route in %s, each a single link',
    (locale, heading, standaloneTitle) => {
      renderMarketing(
        <Sources routes={[SHOPIFY, WOOCOMMERCE, EASYORDERS, STANDALONE]} />,
        locale
      )

      expect(screen.getByRole('heading', { name: heading })).toBeTruthy()
      expect(
        screen
          .getAllByRole('heading', { level: 3 })
          .map((title) => title.textContent)
      ).toEqual(['Shopify', 'WooCommerce', 'EasyOrders', standaloneTitle])
      expect(cards().map((card) => card.getAttribute('href'))).toEqual([
        SHOPIFY_APP_STORE_LISTING_URL,
        `/${locale}/signup?source=woocommerce`,
        `/${locale}/signup?source=easyorders`,
        `/${locale}/signup?source=standalone`,
      ])
    }
  )

  it('leaves out a store whose switch is off', () => {
    renderMarketing(
      <Sources routes={[SHOPIFY, EASYORDERS, STANDALONE]} />,
      'en'
    )

    expect(cards()).toHaveLength(3)
    expect(screen.queryByText('WooCommerce')).toBeNull()
    expect(screen.queryByText('Start with WooCommerce')).toBeNull()
  })

  it('states where each route is billed', () => {
    renderMarketing(
      <Sources routes={[SHOPIFY, WOOCOMMERCE, EASYORDERS, STANDALONE]} />,
      'en'
    )

    const [shopify, ...akeedAccounts] = cards()
    expect(shopify.textContent).toContain('Plan and billing inside Shopify')
    for (const card of akeedAccounts) {
      expect(card.textContent).toContain('Akeed account · pay as you go')
    }
  })

  it('names the three ways to add orders on the no-store card only', () => {
    renderMarketing(
      <Sources routes={[SHOPIFY, WOOCOMMERCE, STANDALONE]} />,
      'en'
    )

    const [shopify, wooCommerce, standalone] = cards()
    for (const chip of ['Manual entry', 'CSV or Excel file', 'Orders API']) {
      expect(standalone.textContent).toContain(chip)
      expect(shopify.textContent).not.toContain(chip)
      expect(wooCommerce.textContent).not.toContain(chip)
    }
  })
})
