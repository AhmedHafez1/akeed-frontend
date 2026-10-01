import { act, fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import { fetchPurchase } from '../api/billingApi'
import type { CreditSummary, PurchaseDetail } from '../domain/billing.types'
import { useBillingSummary } from '../domain/useBillingSummary'
import { BillingReturnPage } from './BillingReturnPage'

const REFERENCE = 'akd_4e1f0123456789abcdef012345679b07'
const RETURN_TO = '/imports/0f8fad5b-d9cb-469f-a165-70867728950e?start=1'
const RETURN_TO_KEY = 'akeed:billing:returnTo'

const route = vi.hoisted(() => ({
  locale: 'ar',
  search: '',
  emit: vi.fn(() => Promise.resolve()),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => `/${route.locale}/billing/return`,
  useSearchParams: () => new URLSearchParams(route.search),
}))
vi.mock('@/shared/query/domainEvents', () => ({
  useEmitDomainEvent: () => route.emit,
}))
vi.mock('../api/billingApi', () => ({ fetchPurchase: vi.fn() }))
vi.mock('../domain/useBillingSummary', () => ({ useBillingSummary: vi.fn() }))

const summary: CreditSummary = {
  billingEnabled: true,
  status: 'active',
  postedBalance: 888,
  heldCredits: 0,
  availableCredits: 888,
  debtCredits: 0,
  lowBalanceThreshold: 50,
  freeGrant: { granted: true, quantity: 30, grantedAt: null },
  price: { unitPriceMinor: 200, currency: 'EGP' },
  range: { min: 100, max: 5000, step: 50 },
  canPurchase: true,
  purchaseDenialReason: null,
}

function purchase(overrides: Partial<PurchaseDetail> = {}): PurchaseDetail {
  return {
    reference: REFERENCE,
    status: 'successful',
    disputeStatus: 'none',
    quantity: 500,
    unitPriceMinor: 200,
    totalMinor: 100_000,
    currency: 'EGP',
    refundedMinor: 0,
    reconciliationRequired: false,
    checkoutExpiresAt: null,
    createdAt: new Date(2026, 9, 1, 8, 50).toISOString(),
    updatedAt: new Date(2026, 9, 1, 8, 52).toISOString(),
    ...overrides,
  }
}

/** `fresh` is a balance read after the payment; otherwise it predates it. */
function mockSummary(
  freshness: 'fresh' | 'stale',
  account: Partial<CreditSummary> = {},
  isFetching = false
) {
  vi.mocked(useBillingSummary).mockReturnValue({
    summary: { ...summary, ...account },
    isLoading: false,
    error: null,
    isFetching,
    updatedAt: freshness === 'fresh' ? Date.now() + 60_000 : 1,
    refresh: vi.fn(),
  })
}

function renderPage(lang: 'ar' | 'en' = 'ar') {
  route.locale = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  return render(
    <NextIntlClientProvider
      locale={lang}
      messages={lang === 'ar' ? ar : en}
      timeZone="UTC"
    >
      <BillingReturnPage />
    </NextIntlClientProvider>
  )
}

const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name })

const primaryButtons = (container: HTMLElement) =>
  container.querySelectorAll('a.bg-brand, button.bg-brand')

/** The dd beside a dt, by the dt's label. */
const detail = (label: string) =>
  screen.getByText(label).nextElementSibling?.textContent

beforeEach(() => {
  route.search = `purchaseRef=${REFERENCE}`
  route.emit.mockClear()
  vi.mocked(fetchPurchase).mockReset()
  vi.mocked(fetchPurchase).mockResolvedValue(purchase())
  mockSummary('fresh')
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BillingReturnPage (ar)', () => {
  it('names the outcome of a successful payment and the new balance', async () => {
    const { container } = renderPage()

    await heading('أضفنا 500 رسالة إلى رصيدك')
    expect(screen.getByText('رصيدك الآن', { exact: false }).textContent).toBe(
      'رصيدك الآن 888 رسالة، ونرسل التأكيدات للطلبات الجديدة كالمعتاد.'
    )

    const card = container.querySelector('section')
    expect(card?.getAttribute('aria-live')).toBe('polite')
    expect(card?.hasAttribute('aria-busy')).toBe(false)
    expect(container.querySelector('.size-14')?.className).toContain(
      'bg-brand-soft text-brand'
    )

    expect(detail('الرسائل')).toBe('500')
    expect(detail('المبلغ')).toBe('1,000.00 ج.م')
    expect(detail('آخر تحديث')).toBe('1 أكتوبر 2026 · 8:52 ص')
    const pill = screen.getByText('ناجحة')
    expect(pill.className).toContain('bg-brand-soft')

    const chip = screen.getByText('akd_4e1f…9b07')
    expect(chip.getAttribute('title')).toBe(REFERENCE)
    expect(chip.getAttribute('dir')).toBe('ltr')

    // Nothing is waiting for the merchant, so going back is the only action.
    expect(
      screen
        .getByRole('link', { name: 'العودة إلى الفوترة' })
        .getAttribute('href')
    ).toBe('/ar/billing')
    expect(primaryButtons(container).length).toBe(0)
    expect(route.emit).toHaveBeenCalledWith('credits.purchased')
  })

  it('leaves the balance out until it was read after the payment', async () => {
    mockSummary('stale')
    renderPage()

    await heading('أضفنا 500 رسالة إلى رصيدك')
    expect(screen.getByText('الرسائل متاحة في رصيدك الآن.')).toBeTruthy()
    expect(screen.queryByText('ونرسل التأكيدات', { exact: false })).toBeNull()
  })

  it('leaves the balance out while it is being read again', async () => {
    mockSummary('fresh', {}, true)
    renderPage()

    await heading('أضفنا 500 رسالة إلى رصيدك')
    expect(screen.getByText('الرسائل متاحة في رصيدك الآن.')).toBeTruthy()
  })

  it('does not promise confirmations when the account cannot send', async () => {
    mockSummary('fresh', { status: 'suspended' })
    renderPage()

    await heading('أضفنا 500 رسالة إلى رصيدك')
    expect(screen.getByText('الرسائل متاحة في رصيدك الآن.')).toBeTruthy()
  })

  it('offers to continue the import that sent the merchant here', async () => {
    window.sessionStorage.setItem(RETURN_TO_KEY, RETURN_TO)
    const { container } = renderPage()

    const link = await screen.findByRole('link', { name: 'متابعة الاستيراد' })
    expect(link.getAttribute('href')).toBe(`/ar${RETURN_TO}`)
    expect(primaryButtons(container).length).toBe(1)

    link.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(link)
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull()
  })

  it('says a pending payment is being checked and offers a refresh', async () => {
    vi.mocked(fetchPurchase).mockResolvedValue(purchase({ status: 'pending' }))
    const { container } = renderPage()

    await heading('نتحقق من الدفع')
    expect(
      screen.getByText(
        'ننتظر تأكيد Paymob. اترك الصفحة مفتوحة أو عد لاحقًا؛ لن نُنشئ عملية جديدة.'
      )
    ).toBeTruthy()
    expect(container.querySelector('.size-14')?.className).toContain(
      'bg-ak-info-soft text-ak-info'
    )
    expect(screen.getByText('قيد الانتظار').className).toContain(
      'bg-ak-info-soft'
    )
    expect(screen.getByRole('button', { name: 'تحديث الحالة' })).toBeTruthy()
    expect(primaryButtons(container).length).toBe(1)
    expect(route.emit).not.toHaveBeenCalled()
  })

  it('shows a spinner and a busy label while a manual refresh runs', async () => {
    vi.mocked(fetchPurchase).mockResolvedValue(purchase({ status: 'pending' }))
    renderPage()
    const refresh = await screen.findByRole('button', { name: 'تحديث الحالة' })

    let settle: (value: PurchaseDetail) => void = () => undefined
    vi.mocked(fetchPurchase).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve
      })
    )
    fireEvent.click(refresh)

    const busy = await screen.findByRole('button', { name: 'جارٍ التحديث…' })
    expect(busy).toHaveProperty('disabled', true)
    expect(busy.querySelector('svg')?.getAttribute('class')).toContain(
      'motion-safe:animate-spin'
    )

    await act(async () => settle(purchase()))
    await heading('أضفنا 500 رسالة إلى رصيدك')
  })

  it('stops polling after five tries and says the payment is still waiting', async () => {
    vi.useFakeTimers()
    vi.mocked(fetchPurchase).mockResolvedValue(purchase({ status: 'pending' }))
    renderPage()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000 * 6)
    })

    expect(fetchPurchase).toHaveBeenCalledTimes(6)
    expect(
      screen.getByRole('heading', { name: 'ما زلنا ننتظر تأكيد الدفع' })
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'تحديث الحالة' })).toBeTruthy()
  })

  it('says no credit was added after a failed payment and offers a new one', async () => {
    vi.mocked(fetchPurchase).mockResolvedValue(purchase({ status: 'failed' }))
    const { container } = renderPage()

    await heading('لم تكتمل الدفعة')
    expect(
      screen.getByText(
        'لم يُضف رصيد إلى حسابك. يمكنك بدء عملية شراء جديدة متى شئت.'
      )
    ).toBeTruthy()
    expect(container.querySelector('.size-14')?.className).toContain(
      'bg-ak-danger-soft text-ak-danger'
    )
    expect(screen.getByText('فشلت').className).toContain('bg-ak-danger-soft')
    expect(
      screen
        .getByRole('link', { name: 'بدء عملية شراء جديدة' })
        .getAttribute('href')
    ).toBe('/ar/billing')
    expect(primaryButtons(container).length).toBe(1)
  })

  it.each([
    ['expired', 'انتهت صلاحية رابط الدفع'],
    ['canceled', 'أُلغيت الدفعة'],
  ] as const)('keeps a %s payment neutral', async (status, title) => {
    vi.mocked(fetchPurchase).mockResolvedValue(purchase({ status }))
    const { container } = renderPage()

    await heading(title)
    expect(container.querySelector('.size-14')?.className).toContain(
      'bg-neutral-soft text-ink-muted'
    )
    expect(
      screen.getByRole('link', { name: 'بدء عملية شراء جديدة' })
    ).toBeTruthy()
  })

  it('holds a payment under review without offering a new purchase', async () => {
    vi.mocked(fetchPurchase).mockResolvedValue(
      purchase({ status: 'failed', reconciliationRequired: true })
    )
    const { container } = renderPage()

    await heading('نراجع هذه الدفعة')
    expect(container.querySelector('.size-14')?.className).toContain(
      'bg-ak-warning-soft text-ak-warning'
    )
    expect(primaryButtons(container).length).toBe(0)
  })

  it('never reads a reference that is not an Akeed one', async () => {
    route.search = 'purchaseRef=not-a-reference'
    const { container } = renderPage()

    await heading('رابط الدفع غير صالح')
    expect(fetchPurchase).not.toHaveBeenCalled()
    expect(container.querySelector('dl')).toBeNull()
    expect(container.querySelector('.size-14')?.className).toContain(
      'bg-ak-warning-soft text-ak-warning'
    )
    expect(primaryButtons(container).length).toBe(0)
  })

  it('offers a refresh when the status cannot be read, then recovers', async () => {
    vi.mocked(fetchPurchase).mockRejectedValueOnce(new Error('offline'))
    const { container } = renderPage()

    await heading('تعذّر تحميل حالة الدفع')
    expect(container.querySelector('dl')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'تحديث الحالة' }))
    await heading('أضفنا 500 رسالة إلى رصيدك')
    expect(fetchPurchase).toHaveBeenCalledTimes(2)
  })

  it('keeps the card mounted and busy while the first read is in flight', () => {
    vi.mocked(fetchPurchase).mockReturnValue(new Promise(() => undefined))
    const { container } = renderPage()

    const card = container.querySelector('section')
    expect(card?.getAttribute('aria-live')).toBe('polite')
    expect(card?.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByRole('heading')).toBeNull()
  })
})

describe('BillingReturnPage (en)', () => {
  it('names the outcome of a successful payment and the new balance', async () => {
    renderPage('en')

    await heading('We added 500 messages to your balance')
    expect(
      screen.getByText('Your balance is now', { exact: false }).textContent
    ).toBe(
      'Your balance is now 888 messages, and new orders keep getting confirmed as usual.'
    )
    expect(detail('Messages')).toBe('500')
    expect(detail('Amount')).toBe('EGP 1,000.00')
    expect(detail('Last updated')).toBe('Oct 1, 2026 · 8:52 AM')
    expect(screen.getByText('Successful')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Back to billing' }).getAttribute('href')
    ).toBe('/en/billing')
  })

  it('says a pending payment is being checked and offers a refresh', async () => {
    vi.mocked(fetchPurchase).mockResolvedValue(purchase({ status: 'pending' }))
    renderPage('en')

    await heading('Checking your payment')
    expect(screen.getByText('Pending')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Refresh status' })).toBeTruthy()
  })

  it('says no credit was added after a failed payment and offers a new one', async () => {
    vi.mocked(fetchPurchase).mockResolvedValue(purchase({ status: 'failed' }))
    renderPage('en')

    await heading('The payment didn’t go through')
    expect(screen.getByText('Failed')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'Start a new purchase' })
        .getAttribute('href')
    ).toBe('/en/billing')
  })
})
