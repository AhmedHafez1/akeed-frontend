import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import { MessagePhonePreview } from './MessagePhonePreview'
import { renderOnboardingStandalone } from './onboardingTestUtils'

const arabic = templateMessageFixture(
  [
    'أهلًا بك {{customer}} 👋',
    'طلبك رقم #{{order}} من {{store}} بقيمة {{total}}',
  ],
  ['تأكيد الطلب', 'إلغاء الطلب'],
  { direction: 'rtl', source: 'provider' }
)
const english = templateMessageFixture(
  ['Hi {{customer}}!', 'Your order #{{order}} from {{store}} for {{total}}'],
  ['Confirm Order', 'Cancel Order']
)

describe('MessagePhonePreview (US-08-07g)', () => {
  it('fills an Arabic message, keeping the order number in one piece', () => {
    renderOnboardingStandalone(
      <MessagePhonePreview
        message={arabic}
        language="ar"
        storeName="متجر نور"
        currency="EGP"
      />,
      'ar'
    )
    expect(screen.getByText('أهلًا بك أحمد 👋')).toBeTruthy()
    const body = screen.getByText(/طلبك رقم/)
    expect(body.textContent).toContain('⁨#TEST‑1⁩')
    expect(body.textContent).not.toContain('##')
    expect(body.textContent).toContain('متجر نور')
    expect(screen.getByText('تأكيد الطلب')).toBeTruthy()
    expect(screen.getByText('إلغاء الطلب')).toBeTruthy()
  })

  it('fills an English message with its own replies', () => {
    renderOnboardingStandalone(
      <MessagePhonePreview
        message={english}
        language="en"
        storeName="Nour"
        currency="USD"
      />,
      'en'
    )
    expect(screen.getByText('Hi Ahmed!')).toBeTruthy()
    expect(screen.getByText(/Your order/).textContent).toContain('Nour')
    expect(screen.getByText('Confirm Order')).toBeTruthy()
  })

  it.each([
    ['ar', ar.onboarding.test.phone.previewError],
    ['en', en.onboarding.test.phone.previewError],
  ] as const)(
    'says so in %s when the message cannot be loaded',
    (lang, text) => {
      renderOnboardingStandalone(
        <MessagePhonePreview
          message={null}
          isError
          language={lang}
          storeName=""
          currency="EGP"
        />,
        lang
      )
      expect(screen.getByRole('alert').textContent).toBe(text)
    }
  )

  it.each([
    ['ar', ar.standaloneOnboarding.test.unavailable.previewEmpty],
    ['en', en.standaloneOnboarding.test.unavailable.previewEmpty],
  ] as const)('says so in %s when the message has no text', (lang, text) => {
    renderOnboardingStandalone(
      <MessagePhonePreview
        message={templateMessageFixture([], ['OK'])}
        language={lang}
        storeName=""
        currency="EGP"
      />,
      lang
    )
    expect(screen.getByText(text)).toBeTruthy()
  })

  it('shows a placeholder while the message loads', () => {
    const { container } = renderOnboardingStandalone(
      <MessagePhonePreview
        message={null}
        language="ar"
        storeName=""
        currency="EGP"
      />,
      'ar'
    )
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
