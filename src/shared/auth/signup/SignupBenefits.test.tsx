import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderAuth } from '../authTestUtils'
import { SignupBenefits } from './SignupBenefits'

describe('SignupBenefits', () => {
  it('describes both methods only while Google is enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_AUTH_ENABLED', 'true')
    try {
      renderAuth(<SignupBenefits locale="en" sourceId="woocommerce" />, 'en')
      expect(screen.getByText(/Use Google, or confirm your email/)).toBeTruthy()
      expect(screen.queryByText('Verify your email')).toBeNull()
    } finally {
      vi.unstubAllEnvs()
    }
  })
  it.each([
    ['standalone', 'Add your first order'],
    ['woocommerce', 'Connect your store'],
    ['easyorders', 'Connect your store'],
  ])(
    'lists three steps for %s, then the free allowance and the price',
    (sourceId, ownStep) => {
      renderAuth(<SignupBenefits locale="en" sourceId={sourceId} />, 'en')

      const aside = screen.getByRole('complementary', {
        name: 'What happens next',
      })
      const steps = within(aside).getAllByRole('listitem')
      expect(steps).toHaveLength(3)
      expect(steps[0].textContent).toContain('Verify your email')
      expect(aside.textContent).toContain(ownStep)
      expect(aside.textContent).toContain('Try the message on your phone')

      expect(within(aside).getByText('30 free WhatsApp messages')).toBeTruthy()
      expect(
        within(aside).getByText(
          'Then 2.00 EGP per WhatsApp message. No monthly subscription, and no card to start.'
        )
      ).toBeTruthy()
    }
  )

  it('says how each store is connected', () => {
    const { unmount } = renderAuth(
      <SignupBenefits locale="en" sourceId="woocommerce" />,
      'en'
    )
    expect(
      screen.getByText(/approve the connection in your WooCommerce admin/)
    ).toBeTruthy()
    expect(screen.getByText(/No keys to copy/)).toBeTruthy()
    unmount()

    renderAuth(<SignupBenefits locale="en" sourceId="easyorders" />, 'en')
    expect(
      screen.getByText('You connect your EasyOrders store from the setup page.')
    ).toBeTruthy()
  })

  it('renders the Arabic copy with Western digits', () => {
    renderAuth(<SignupBenefits locale="ar" sourceId="standalone" />)

    expect(
      screen.getByRole('complementary', { name: 'ما الذي يحدث بعد ذلك' })
    ).toBeTruthy()
    expect(screen.getByText('30 رسالة واتساب مجانية')).toBeTruthy()
    expect(
      screen.getByText(
        'ثم 2.00 ج.م لكل رسالة واتساب. بدون اشتراك شهري وبدون بطاقة ائتمان للبدء.'
      )
    ).toBeTruthy()
  })
})
