import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMarketing } from '@/features/marketing/ui/marketingTestUtils'
import { getShopifyAppStoreListingUrl } from '@/shared/lib/shopify-auth'
import Hero from './Hero'

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
      expect(shopify.getAttribute('href')).toBe(
        getShopifyAppStoreListingUrl(locale)
      )
      expect(heroLinks()).toHaveLength(2)
    }
  )

  it('no longer links to "See how it works"', () => {
    renderMarketing(<Hero />, 'en')

    expect(screen.queryByText('See how it works')).toBeNull()
    expect(document.querySelector('a[href="#how-it-works"]')).toBeNull()
  })

  it('states the value in one short line, and the three microcopy facts', () => {
    renderMarketing(<Hero />, 'en')

    expect(
      screen.getByText(
        'Akeed automatically messages your customers on WhatsApp, records their reply and updates the order status before you ship.'
      )
    ).toBeTruthy()
    expect(screen.getByText('100 free WhatsApp messages')).toBeTruthy()
    expect(screen.getByText('No credit card required')).toBeTruthy()
    expect(screen.getByText('Official WhatsApp Business Platform')).toBeTruthy()
  })

  it('shows the real Arabic template with its two replies on the phone', () => {
    renderMarketing(<Hero />, 'ar')

    const phone = screen.getByRole('img', {
      name: /^رسالة تأكيد واتساب من أكيد لطلب تجريبي/,
    })
    expect(phone.textContent).toContain(
      'يرجى تأكيد الطلب لنتمكن من إرساله إليك بأسرع وقت.'
    )
    expect(phone.textContent).toContain('1042')
    expect(phone.textContent).toContain('تأكيد الطلب')
    expect(phone.textContent).toContain('إلغاء الطلب')
    // A picture of the message, not a control that could confirm an order.
    expect(phone.querySelector('button, a')).toBeNull()
  })

  it('leaves the counter out when there is no real total', () => {
    renderMarketing(<Hero confirmedOrdersTotal={null} />, 'en')

    expect(screen.queryByText('orders confirmed through Akeed')).toBeNull()
  })

  it('lists the order sources for screen readers, apart from WhatsApp', () => {
    renderMarketing(<Hero />, 'en')

    const sources = screen.getByRole('list', { name: 'Order sources' })
    expect(sources.textContent).toContain('Shopify')
    expect(sources.textContent).not.toContain('WhatsApp')
  })

  it('scrolls the logos, WhatsApp among them, in a decorative strip', () => {
    renderMarketing(<Hero />, 'en')

    const track = document.querySelector('.animate-marquee')
    expect(track?.closest('[aria-hidden]')).toBeTruthy()
    expect(track?.textContent).toContain('WhatsApp')
    expect(track?.textContent).toContain('Shopify')
  })
})
