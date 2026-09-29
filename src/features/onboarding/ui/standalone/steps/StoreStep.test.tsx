import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBillingSummary } from '@/features/billing'
import type { StandaloneOnboardingFlow } from '@/features/onboarding/hooks/useStandaloneOnboardingFlow'
import { StoreStep } from './StoreStep'
import { renderStep } from './stepTestUtils'

vi.mock('@/features/billing', () => ({ useBillingSummary: vi.fn() }))
vi.mock('@/features/onboarding/api/onboardingApi', () => ({
  fetchTemplatePreviews: vi.fn(async () => {
    const preview = {
      greeting: 'أهلًا بك {{customer}}',
      body: 'شكرًا لتسوّقك من {{store}}. طلبك رقم {{order}} بقيمة {{total}}.',
      totalLabel: 'إجمالي الطلب: {{total}}',
      ending: 'يرجى تأكيد الطلب.',
      confirmButton: 'تأكيد الطلب',
      cancelButton: 'إلغاء الطلب',
    }
    return { ar: preview, en: { ...preview, greeting: 'Hi {{customer}}' } }
  }),
}))

const summary = {
  availableCredits: 30,
  price: { unitPriceMinor: 200, currency: 'EGP' },
}

function makeStore(
  overrides: Partial<StandaloneOnboardingFlow['store']> = {}
): StandaloneOnboardingFlow['store'] {
  return {
    form: {
      storeName: 'متجر نور',
      phone: '+201012345670',
      phoneCountry: 'EG',
      language: 'auto',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
    },
    fieldErrors: {},
    saveError: null,
    isSubmitting: false,
    setStoreName: vi.fn(),
    setPhone: vi.fn(),
    setPhoneCountry: vi.fn(),
    setLanguage: vi.fn(),
    setCurrency: vi.fn(),
    setTimezone: vi.fn(),
    submit: vi.fn(),
    ...overrides,
  }
}

function renderStore(
  props: Partial<Parameters<typeof StoreStep>[0]> = {},
  lang: 'ar' | 'en' = 'ar'
) {
  const onSubmit = vi.fn()
  renderStep(
    <StoreStep
      store={makeStore()}
      isLoading={false}
      canManage
      headingRef={{ current: null }}
      onSubmit={onSubmit}
      {...props}
    />,
    lang
  )
  return { onSubmit }
}

beforeEach(() => {
  vi.mocked(useBillingSummary).mockReturnValue({
    summary,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  } as unknown as ReturnType<typeof useBillingSummary>)
})

describe('StoreStep', () => {
  it('shows the heading, fields and the picked defaults', () => {
    renderStore()
    expect(
      screen.getByRole('heading', { name: 'جهّز رسالة التأكيد لمتجرك' })
    ).toBeTruthy()
    expect(screen.getByLabelText('اسم المتجر كما يظهر في الرسالة')).toBeTruthy()
    expect(screen.getByText('أخذناه من بيانات التسجيل.')).toBeTruthy()
    expect(screen.getByText('رقم واتساب الخاص بك')).toBeTruthy()
    expect(screen.getByText('اخترنا لك')).toBeTruthy()
    expect(screen.getByText('تلقائي حسب رقم العميل')).toBeTruthy()
    expect(screen.getByText('جنيه مصري (ج.م)')).toBeTruthy()
    expect(screen.getByText('القاهرة')).toBeTruthy()
    expect(
      screen.getByText('لن نرسل شيئًا لعملائك قبل أن تضيف طلبًا.')
    ).toBeTruthy()
  })

  it('states the free credits and the price after them', () => {
    renderStore()
    expect(screen.getByText('رصيدك 30 رسالة تأكيد مجانية')).toBeTruthy()
    expect(
      screen.getByText('بدون بطاقة دفع. بعدها 2.00 ج.م فقط لكل رسالة تُرسل.')
    ).toBeTruthy()
  })

  it('never shows a zero balance while credits load', () => {
    vi.mocked(useBillingSummary).mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useBillingSummary>)
    renderStore()
    expect(screen.getByTestId('credits-banner-skeleton')).toBeTruthy()
    expect(screen.queryByText(/رصيدك 0/)).toBeNull()
  })

  it('submits through the primary and edits the store name', () => {
    const store = makeStore()
    const { onSubmit } = renderStore({ store })
    fireEvent.change(screen.getByLabelText('اسم المتجر كما يظهر في الرسالة'), {
      target: { value: 'متجر سارة' },
    })
    expect(store.setStoreName).toHaveBeenCalledWith('متجر سارة')
    fireEvent.click(
      screen.getByRole('button', { name: 'التالي: أرسل رسالة تجريبية' })
    )
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('shows field errors in place of the hints', () => {
    renderStore({
      store: makeStore({
        fieldErrors: {
          storeName: 'اكتب اسم متجرك كما يعرفه عملاؤك.',
          merchantWhatsappPhone: 'الرقم ناقص.',
        },
      }),
    })
    const name = screen.getByLabelText('اسم المتجر كما يظهر في الرسالة')
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('اكتب اسم متجرك كما يعرفه عملاؤك.')).toBeTruthy()
    expect(screen.queryByText('أخذناه من بيانات التسجيل.')).toBeNull()
    expect(screen.getByText('الرقم ناقص.')).toBeTruthy()
  })

  it('shows one danger banner when saving failed', () => {
    renderStore({ store: makeStore({ saveError: 'تعذّر الحفظ' }) })
    expect(screen.getByRole('alert').textContent).toContain('تعذّر الحفظ')
  })

  it('shows skeletons and a disabled primary while loading', () => {
    renderStore({ isLoading: true })
    expect(screen.getByText('نجهّز بيانات متجرك…')).toBeTruthy()
    expect(
      (
        screen.getByRole('button', {
          name: 'التالي: أرسل رسالة تجريبية',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(screen.queryByLabelText('اسم المتجر كما يظهر في الرسالة')).toBeNull()
  })

  it('hides the primary for a viewer', () => {
    renderStore({ canManage: false })
    expect(
      screen.queryByRole('button', { name: 'التالي: أرسل رسالة تجريبية' })
    ).toBeNull()
  })

  it('fills the live preview with the typed store name', async () => {
    renderStore()
    expect(screen.getByText('هكذا تصل الرسالة لعميلك')).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByText(/شكرًا لتسوّقك من متجر نور/)).toBeTruthy()
    )
    expect(screen.getByText(/#TEST\u20111/)).toBeTruthy()
    expect(screen.getByText('أهلًا بك أحمد')).toBeTruthy()
  })

  it('renders the English copy', () => {
    renderStore({}, 'en')
    expect(
      screen.getByRole('heading', {
        name: 'Get your confirmation message ready',
      })
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Next: send a test message' })
    ).toBeTruthy()
  })
})
