import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type {
  OnboardingTestState,
  OnboardingTestStatus,
} from '@/features/onboarding/domain/onboarding.types'
import type { StandaloneOnboardingFlow } from '@/features/onboarding/hooks/useStandaloneOnboardingFlow'
import { TestStep } from './TestStep'
import { renderStep } from './stepTestUtils'
import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'

function makeTestState(
  status: OnboardingTestStatus | null,
  overrides: Partial<OnboardingTestState> = {}
): OnboardingTestState {
  const now = new Date().toISOString()
  return {
    phone: '+20 101 234 5670',
    language: 'ar',
    message: templateMessageFixture(
      [
        'أهلًا بك {{customer}}',
        'طلبك من {{store}}',
        'إجمالي الطلب: {{total}}',
        'يرجى تأكيد الطلب.',
      ],
      ['تأكيد الطلب', 'إلغاء الطلب'],
      { direction: 'rtl' }
    ),
    sample: {
      customerName: 'أحمد',
      orderNumber: 'TEST-1',
      total: '250',
      currency: 'EGP',
      storeName: 'متجر نور',
    },
    test: status
      ? {
          verificationId: 'v-1',
          status,
          sentAt: now,
          deliveredAt: status === 'delivered' ? now : null,
          readAt: null,
          confirmedAt: null,
          canceledAt: status === 'canceled' ? now : null,
        }
      : null,
    resendAvailableAt: null,
    sendsRemainingToday: 4,
    testConfirmedAt: null,
    testSkippedAt: null,
    ...overrides,
  }
}

function makeTest(
  overrides: Partial<StandaloneOnboardingFlow['test']> = {}
): StandaloneOnboardingFlow['test'] {
  return {
    testState: makeTestState('delivered'),
    isLoading: false,
    isSending: false,
    isSkipping: false,
    error: null,
    isUnavailable: false,
    retry: vi.fn(),
    skip: vi.fn(),
    changeNumber: vi.fn(),
    continueToDashboard: vi.fn(),
    ...overrides,
  }
}

function renderTest(props: Partial<Parameters<typeof TestStep>[0]> = {}) {
  const test = props.test ?? makeTest()
  renderStep(
    <TestStep
      test={test}
      completion={{ isCompleting: false, error: null, retry: vi.fn() }}
      blockedReasons={[]}
      phone="+201012345670"
      storeName="متجر نور"
      canManage
      headingRef={{ current: null }}
      {...props}
    />
  )
  return test
}

describe('TestStep', () => {
  it('shows where it was sent and the live timeline', () => {
    renderTest()
    expect(
      screen.getByRole('heading', { name: 'شاهد ما سيراه عميلك' })
    ).toBeTruthy()
    expect(screen.getByText('أُرسلت إلى')).toBeTruthy()
    expect(screen.getByText('+20 101 234 5670')).toBeTruthy()
    expect(screen.getByText('تم الإرسال')).toBeTruthy()
    expect(screen.getByText('وصلت إلى هاتفك')).toBeTruthy()
    expect(screen.getByText('اضغط «تأكيد الطلب» على هاتفك')).toBeTruthy()
    expect(screen.getByText('هذا بالضبط ما سيفعله عميلك.')).toBeTruthy()
    expect(
      screen.getByText('الرسالة التجريبية مجانية ولا تُخصم من رصيدك.')
    ).toBeTruthy()
  })

  it('has no primary on desktop: resend and a quiet skip', () => {
    const test = renderTest()
    fireEvent.click(
      screen.getByRole('button', { name: 'لم تصلني؟ أعد الإرسال' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'تخطَّ الآن، وجرّبها لاحقًا' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'تغيير الرقم' }))
    expect(test.retry).toHaveBeenCalledTimes(1)
    expect(test.skip).toHaveBeenCalledTimes(1)
    expect(test.changeNumber).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole('button', { name: 'المتابعة إلى لوحة التحكم' })
    ).toBeNull()
  })

  it('counts the resend cooldown down in the label', () => {
    renderTest({
      test: makeTest({
        testState: makeTestState('sent', {
          resendAvailableAt: new Date(Date.now() + 24_500).toISOString(),
        }),
      }),
    })
    const resend = screen.getByRole('button', {
      name: /لم تصلني؟ أعد الإرسال خلال \d+ ث/,
    }) as HTMLButtonElement
    expect(resend.disabled).toBe(true)
  })

  it('disables resend at the daily limit but keeps skip', () => {
    renderTest({
      test: makeTest({
        testState: makeTestState('sent', { sendsRemainingToday: 0 }),
        error: 'daily_limit',
      }),
    })
    expect(
      (
        screen.getByRole('button', {
          name: 'لم تصلني؟ أعد الإرسال',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(screen.getByText(/وصلت إلى الحد اليومي/)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'تخطَّ الآن، وجرّبها لاحقًا' })
    ).toBeTruthy()
  })

  it('explains the daily limit before the merchant tries to resend', () => {
    renderTest({
      test: makeTest({
        testState: makeTestState('sent', { sendsRemainingToday: 0 }),
      }),
    })
    expect(screen.getByText(/وصلت إلى الحد اليومي/)).toBeTruthy()
  })

  it('shows a Cancel reply as the finished answer, not a dead end', () => {
    renderTest({
      test: makeTest({ testState: makeTestState('canceled') }),
    })
    const answer = screen.getByText('ألغيت الطلب').closest('li')
    expect(answer?.getAttribute('aria-current')).toBeNull()
    expect(screen.queryByText('اضغط «تأكيد الطلب» على هاتفك')).toBeNull()
    expect(screen.queryByText('هذا بالضبط ما سيفعله عميلك.')).toBeNull()
  })

  it('makes Change number the primary when delivery failed', () => {
    const test = renderTest({
      test: makeTest({ testState: makeTestState('failed') }),
    })
    expect(screen.getByText(/تعذّر على واتساب إيصال الرسالة/)).toBeTruthy()
    const buttons = screen.getAllByRole('button', { name: 'تغيير الرقم' })
    expect(buttons).toHaveLength(1)
    fireEvent.click(buttons[0])
    expect(test.changeNumber).toHaveBeenCalled()
  })

  it('explains an Akeed outage and offers to continue', () => {
    const test = renderTest({ test: makeTest({ isUnavailable: true }) })
    expect(screen.getByText('لم نتمكن من الوصول إلى واتساب الآن')).toBeTruthy()
    expect(
      screen.getByText(
        'المشكلة من جهتنا وليست في رقمك. إعدادك محفوظ، ورصيدك لم يُخصم منه شيء.'
      )
    ).toBeTruthy()
    expect(screen.getByText('لم تُرسل')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'المتابعة إلى لوحة التحكم' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'حاول مرة أخرى' }))
    expect(test.continueToDashboard).toHaveBeenCalledTimes(1)
    expect(test.retry).toHaveBeenCalledTimes(1)
  })

  it('lists /complete blockers', () => {
    renderTest({ blockedReasons: ['pilot_entitlement_missing'] })
    expect(screen.getByText('لا يزال الإعداد يحتاج إلى إجراء')).toBeTruthy()
  })

  it('shows a viewer the progress without actions', () => {
    renderTest({ canManage: false })
    expect(screen.queryByRole('button', { name: 'تغيير الرقم' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'تخطَّ الآن، وجرّبها لاحقًا' })
    ).toBeNull()
    expect(screen.getByText('وصلت إلى هاتفك')).toBeTruthy()
  })

  it('emphasises the Confirm reply on the phone while waiting', () => {
    renderTest()
    expect(screen.getByText('أهلًا بك أحمد')).toBeTruthy()
    expect(screen.getByText('تأكيد الطلب')).toBeTruthy()
  })
})
