import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderMarketing } from '@/features/marketing/ui/marketingTestUtils'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import Hero from './Hero'

// The phone demo is a client-only animation; the hero's copy does not need it.
vi.mock('next/dynamic', () => ({ default: () => () => null }))

const heroLinks = () =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-variant]'))

describe('Hero', () => {
  it.each([
    ['en', 'Get started free', 'Install on Shopify'],
    ['ar', 'ابدأ مجانًا', 'ثبّت على Shopify'],
  ] as const)(
    'has exactly one primary action in %s, and the Shopify exit beside it',
    (locale, primaryLabel, shopifyLabel) => {
      renderMarketing(<Hero />, locale)

      const primary = heroLinks().filter(
        (link) => link.dataset.variant === 'primary'
      )
      expect(primary).toHaveLength(1)
      expect(primary[0].textContent).toBe(primaryLabel)
      expect(primary[0].getAttribute('href')).toBe(`/${locale}/signup`)

      const shopify = screen.getByRole('link', { name: shopifyLabel })
      expect(shopify.dataset.variant).toBe('secondary')
      expect(shopify.getAttribute('href')).toBe(SHOPIFY_APP_STORE_LISTING_URL)
      expect(heroLinks()).toHaveLength(2)
    }
  )

  it('no longer links to "See how it works"', () => {
    renderMarketing(<Hero />, 'en')

    expect(screen.queryByText('See how it works')).toBeNull()
    expect(document.querySelector('a[href="#how-it-works"]')).toBeNull()
  })

  it('names only the stores that are switched on, and the three microcopy facts', () => {
    renderMarketing(<Hero />, 'en')

    // No connect switch is on in the test environment.
    expect(
      screen.getByText(
        'Akeed messages the customer on WhatsApp for every order and records the reply, whether your orders come from Shopify, or you add them by hand, from a file, or through the API.'
      )
    ).toBeTruthy()
    expect(screen.getByText('30 free WhatsApp messages')).toBeTruthy()
    expect(screen.getByText('No credit card required')).toBeTruthy()
    expect(screen.getByText('Official WhatsApp Business Platform')).toBeTruthy()
  })

  it('says where the order is updated', () => {
    renderMarketing(<Hero />, 'ar')

    expect(screen.getByText('في متجرك أو لوحة أكيد')).toBeTruthy()
  })
})
