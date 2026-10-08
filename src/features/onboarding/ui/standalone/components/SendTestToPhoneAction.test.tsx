import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchOnboardingTest,
  OnboardingApiError,
  sendOnboardingTest,
} from '@/features/onboarding/api/onboardingApi'
import type { OnboardingTestState } from '@/features/onboarding/domain/onboarding.types'
import ar from '../../../../../../public/messages/ar.json'
import { SendTestToPhoneAction } from './SendTestToPhoneAction'

vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/onboarding/api/onboardingApi')
    >()
  return {
    ...actual,
    fetchOnboardingTest: vi.fn(),
    sendOnboardingTest: vi.fn(),
    skipOnboardingTest: vi.fn(),
  }
})

const idle: OnboardingTestState = {
  phone: '+201012345670',
  language: 'ar',
  message: null as never,
  sample: {
    customerName: 'أحمد',
    orderNumber: 'TEST-1',
    total: '250.00',
    currency: 'EGP',
    storeName: 'متجر نور',
  },
  test: null,
  resendAvailableAt: null,
  sendsRemainingToday: 5,
  testConfirmedAt: null,
  testSkippedAt: '2026-09-29T08:00:00.000Z',
}

const sent: OnboardingTestState = {
  ...idle,
  test: {
    status: 'sent',
    sentAt: '2026-09-29T09:41:00.000Z',
  } as OnboardingTestState['test'],
}

function renderAction() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
        <SendTestToPhoneAction />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.mocked(fetchOnboardingTest).mockReset().mockResolvedValue(idle)
  vi.mocked(sendOnboardingTest).mockReset().mockResolvedValue(sent)
})

describe('SendTestToPhoneAction', () => {
  it('sends nothing until the merchant asks', () => {
    renderAction()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('sends the free test to the saved number and shows its progress', async () => {
    renderAction()
    fireEvent.click(screen.getByRole('button', { name: 'أرسلها إلى هاتفي' }))

    const dialog = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(sendOnboardingTest).toHaveBeenCalledWith({ resend: false })
    )
    // The onboarding test takes no customer number: it goes to the merchant.
    expect(dialog.querySelector('input')).toBeNull()
    expect(await screen.findByText('+20 101 234 5670')).toBeTruthy()
    expect(await screen.findByText('تم الإرسال')).toBeTruthy()
    expect(
      screen.getByText('الرسالة التجريبية مجانية ولا تُخصم من رصيدك.')
    ).toBeTruthy()
  })

  it('explains a cooldown instead of failing silently', async () => {
    vi.mocked(sendOnboardingTest).mockRejectedValue(
      new OnboardingApiError('wait', 429, 'ONBOARDING_TEST_COOLDOWN')
    )
    renderAction()
    fireEvent.click(screen.getByRole('button', { name: 'أرسلها إلى هاتفي' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(ar.onboarding.test.errors.cooldown)
  })
})
