import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { testLocale } from '../../../../test/vitest/setup'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import type { CreditSummary, PurchaseSummary } from '../domain/billing.types'
import { derivePackages } from '../domain/creditPackages'
import { useBillingPage } from '../domain/useBillingPage'
import { useBillingUsage, type BillingUsage } from '../domain/useBillingUsage'
import { BillingStandalonePage } from './BillingStandalonePage'

vi.mock('../domain/useBillingPage', () => ({ useBillingPage: vi.fn() }))
vi.mock('../domain/useBillingUsage', () => ({ useBillingUsage: vi.fn() }))
const presence = vi.hoisted(() => ({ visible: false }))
vi.mock('@/features/whatsapp-connect', () => ({
  useOwnNumberPresence: () => ({ visible: presence.visible, isLoading: false }),
}))

type PageState = ReturnType<typeof useBillingPage>

const summary: CreditSummary = {
  billingEnabled: true,
  status: 'active',
  // 301 displayed credits at EGP 0.50: EGP 150.5.
  postedBalance: 301,
  heldCredits: 0,
  availableCredits: 301,
  balanceMinor: 15_050,
  debtCredits: 0,
  lowBalanceThreshold: 100,
  freeGrant: { granted: true, quantity: 200, grantedAt: null },
  price: {
    unitPriceMinor: 50,
    messagePriceMinor: 100,
    creditsPerMessage: 2,
    akeedMessagePriceMinor: 100,
    currency: 'EGP',
  },
  // EGP 100 to 5,000 in steps of 50.
  range: { min: 200, max: 10_000, step: 100 },
  canPurchase: true,
  purchaseDenialReason: null,
}

const lastPurchase: PurchaseSummary = {
  reference: 'akd_0123456789abcdef0123456789abcdef',
  status: 'successful',
  disputeStatus: 'none',
  quantity: 1000,
  unitPriceMinor: 50,
  totalMinor: 50_000,
  currency: 'EGP',
  refundedMinor: 0,
  reconciliationRequired: false,
  checkoutExpiresAt: null,
  createdAt: new Date(2026, 8, 12, 12).toISOString(),
  updatedAt: new Date(2026, 8, 12, 12).toISOString(),
}

const readyUsage: BillingUsage = {
  status: 'ready',
  usedThisMonth: 212,
  bySender: { akeed: 212, ownNumber: 0 },
  daily: [9, 14, 11, 17, 8, 12, 21, 15, 13, 18, 10, 16, 22, 14],
  dailyBySender: {
    akeed: [9, 14, 11, 17, 8, 12, 21, 15, 13, 18, 10, 16, 22, 14],
    ownNumber: Array(14).fill(0),
  },
  lastPurchase,
}

function mockPage(
  account: Partial<CreditSummary> = {},
  state: Partial<PageState> = {}
) {
  const merged = { ...summary, ...account }
  vi.mocked(useBillingPage).mockReturnValue({
    summary: merged,
    isSummaryLoading: false,
    summaryError: null,
    refreshSummary: vi.fn(),
    packages: derivePackages(merged.range, merged.price.unitPriceMinor),
    selectedPackage: 1000,
    selectPackage: vi.fn(),
    amountInput: '500',
    setAmountInput: vi.fn(),
    amountRange: { min: 100, max: 5000, step: 50 },
    quantity: 1000,
    quantityError: null,
    totalMinor: 50_000,
    adjustQuantity: vi.fn(),
    canPurchase: merged.canPurchase && merged.billingEnabled,
    isLocked: false,
    isCreating: false,
    checkout: null,
    pendingReference: null,
    checkoutError: null,
    createCheckout: vi.fn(),
    startNewPurchase: vi.fn(),
    ...state,
  })
}

function renderPage(lang: 'ar' | 'en' = 'ar') {
  testLocale.current = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  return render(
    <NextIntlClientProvider
      locale={lang}
      messages={lang === 'ar' ? ar : en}
      timeZone="UTC"
    >
      <BillingStandalonePage />
    </NextIntlClientProvider>
  )
}

const RUNWAY = 'يكفي حوالي 28 يومًا بمعدل استخدامك هذا الشهر.'
const PAUSED = 'التأكيدات للطلبات الجديدة متوقفة حتى تشحن الرصيد.'

beforeEach(() => {
  // The 20th: 212 used so far is 10.6 a day, so 301 lasts 28 days.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 12))
  vi.mocked(useBillingUsage).mockReturnValue(readyUsage)
  mockPage()
})

afterEach(() => {
  vi.useRealTimers()
  presence.visible = false
  testLocale.current = 'ar'
})

describe('BillingStandalonePage (ar)', () => {
  it('shows a healthy balance with its runway, stats and one Pay button', () => {
    const { container } = renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'الفوترة والرصيد' })
    ).toBeTruthy()
    const hero = screen.getByText('150.5')
    expect(hero.className).toContain('text-brand')
    expect(hero.parentElement?.textContent).toBe('150.5ج.م')
    expect(screen.getByText('الرصيد كافٍ')).toBeTruthy()
    expect(screen.getByText(RUNWAY)).toBeTruthy()

    // The pill already says it, so a healthy balance has no banner.
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()

    // 212 displayed credits spent: EGP 106.
    expect(screen.getByText('106 ج.م')).toBeTruthy()
    // The last top-up and the order total.
    expect(screen.getAllByText('500 ج.م').length).toBeGreaterThan(1)
    expect(screen.getByText('· 12 سبتمبر')).toBeTruthy()
    expect(screen.getByText('1 ج.م')).toBeTruthy()

    const selected = screen.getByRole('radio', { checked: true })
    expect(selected.textContent).toContain('500ج.م')
    expect(selected.textContent).toContain('500 رسالة')
    expect(
      screen.getByText('من 100 ج.م إلى 5,000 ج.م، بزيادات 50 ج.م.')
    ).toBeTruthy()

    const pay = screen.getByRole('button', { name: 'ادفع 500 ج.م' })
    expect(pay).toHaveProperty('disabled', false)
    expect(container.querySelectorAll('button.bg-brand').length).toBe(1)
    // 301 + 1,000 displayed credits: EGP 650.5.
    expect(
      screen.getByText('الرصيد بعد الشحن', { exact: false }).textContent
    ).toBe('الرصيد بعد الشحن: 650.5 ج.م')
  })

  it('warns once, under the card, when the balance is low', () => {
    mockPage({ availableCredits: 42, postedBalance: 42, balanceMinor: 2100 })
    renderPage()

    expect(screen.getByText('21').className).toContain('text-ak-warning')
    expect(screen.getByText('الرصيد منخفض')).toBeTruthy()
    const banner = screen.getByRole('status')
    expect(banner.textContent).toContain('تبقى 21 ج.م فقط')
    expect(banner.className).toContain('bg-ak-warning-soft')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('says confirmations are paused when the balance is empty', () => {
    mockPage({ availableCredits: 0, postedBalance: 0, balanceMinor: 0 })
    renderPage()

    expect(screen.getByText('الرصيد فارغ')).toBeTruthy()
    expect(screen.getByText(PAUSED)).toBeTruthy()
    expect(screen.queryByText(RUNWAY)).toBeNull()
    const banner = screen.getByRole('alert')
    expect(banner.textContent).toContain('رصيدك فارغ')
    expect(banner.className).toContain('bg-ak-danger-soft')
    // An empty balance is exactly when buying must stay open.
    expect(screen.getByRole('button', { name: 'ادفع 500 ج.م' })).toHaveProperty(
      'disabled',
      false
    )
  })

  it('holds Pay and points to the purchase status while one is pending', () => {
    mockPage({}, { pendingReference: 'akd_0123456789abcdef', isLocked: true })
    renderPage()

    const note = screen.getByRole('status')
    expect(note.textContent).toContain('لديك عملية شراء قيد التحقق')
    expect(
      screen.getByRole('link', { name: 'عرض حالة الشراء' }).getAttribute('href')
    ).toBe('/ar/billing/return?purchaseRef=akd_0123456789abcdef')
    expect(screen.getByRole('button', { name: 'ادفع 500 ج.م' })).toHaveProperty(
      'disabled',
      true
    )
    expect(
      screen.getByRole('button', { name: 'بدء عملية شراء جديدة' })
    ).toBeTruthy()
    for (const tile of screen.getAllByRole('radio'))
      expect(tile).toHaveProperty('disabled', true)
  })

  it('shows no placeholder number while usage loads', () => {
    vi.mocked(useBillingUsage).mockReturnValue({ status: 'loading' })
    renderPage()

    expect(screen.getByText('المصروف هذا الشهر')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText(RUNWAY)).toBeNull()
    expect(screen.getByText('150.5')).toBeTruthy()
  })

  it('disables buying for a read-only member and says why', () => {
    mockPage({ canPurchase: false })
    renderPage()

    expect(
      screen.getByText(
        'لديك صلاحية عرض فقط. يمكن للمالك أو المسؤول شحن الرصيد.'
      )
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'ادفع 500 ج.م' })).toHaveProperty(
      'disabled',
      true
    )
    expect(screen.getByRole('textbox')).toHaveProperty('disabled', true)
  })

  it('hands over to Paymob once the checkout is ready', () => {
    mockPage(
      {},
      {
        isLocked: true,
        checkout: {
          ...lastPurchase,
          status: 'pending',
          checkoutUrl: 'https://paymob.test/checkout',
          duplicate: false,
        },
      }
    )
    renderPage()

    expect(
      screen.getByRole('button', { name: 'المتابعة إلى Paymob' })
    ).toHaveProperty('disabled', false)
    expect(screen.queryByRole('button', { name: /ادفع/ })).toBeNull()
  })
})

describe('BillingStandalonePage (en)', () => {
  it('writes amounts with the currency code first', () => {
    renderPage('en')

    expect(screen.getByRole('button', { name: 'Pay EGP 500' })).toBeTruthy()
    expect(screen.getByText('150.5').parentElement?.textContent).toBe(
      'EGP150.5'
    )
    expect(screen.getByText('Lasts about 28 days at this month’s pace.'))
    expect(screen.getByText('· Sep 12')).toBeTruthy()
  })
})

describe('BillingStandalonePage with the merchant number', () => {
  it('splits this month by number and shows both rates from the server', () => {
    presence.visible = true
    vi.mocked(useBillingUsage).mockReturnValue({
      ...readyUsage,
      usedThisMonth: 270,
      bySender: { akeed: 124, ownNumber: 146 },
    })
    mockPage({
      price: { ...summary.price, ownNumberCreditsPerMessage: 1 },
    })
    renderPage('en')
    const balance = en.billing.balance
    expect(screen.getByText(balance.senders.usedHeading)).toBeTruthy()
    // 124 displayed credits from Akeed's number are 62 messages, EGP 62;
    // 146 from the merchant's number are 146 messages, EGP 73.
    expect(screen.getByText('EGP 62')).toBeTruthy()
    expect(screen.getByText('62 messages')).toBeTruthy()
    expect(screen.getByText('EGP 73')).toBeTruthy()
    expect(screen.getByText('146 messages')).toBeTruthy()
    // Cost per message: EGP 1, and EGP 0.5 from the merchant's number.
    expect(screen.getByText('EGP 1')).toBeTruthy()
    expect(screen.getByText('EGP 0.5')).toBeTruthy()
    // The note sits behind the help icon beside its heading.
    expect(screen.queryByText(balance.senders.usageNote)).toBeNull()
  })

  it('keeps the page as it was while the own number is not offered or used', () => {
    renderPage('en')
    expect(
      screen.queryByText(en.billing.balance.senders.usedHeading)
    ).toBeNull()
  })

  it('shows unavailable usage as a dash, never as zero', () => {
    presence.visible = true
    vi.mocked(useBillingUsage).mockReturnValue({ status: 'unavailable' })
    renderPage('en')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByText('0')).toBeNull()
  })
})

describe('Recharge with the merchant number', () => {
  const coverage = en.billing.purchase.coverage
  const withOwnRate = {
    price: { ...summary.price, ownNumberCreditsPerMessage: 1 },
  }

  it('shows both coverage figures on the tiles and in the summary', () => {
    presence.visible = true
    mockPage(withOwnRate)
    renderPage('en')

    // EGP 500 pays for 500 messages from Akeed's number or 1,000 from yours.
    expect(screen.getByText(coverage.akeed)).toBeTruthy()
    expect(screen.getByText(coverage.own)).toBeTruthy()
    expect(screen.getAllByText('1,000').length).toBeGreaterThan(0)
    // The Meta billing note is help behind the rates icon, shown once.
    expect(
      screen.queryByText(en.whatsappConnect.tab.costs.creditNote)
    ).toBeNull()
  })

  it('counts only Akeed messages while the own number is not offered', () => {
    mockPage(withOwnRate)
    renderPage('en')

    expect(screen.getByText(coverage.akeed)).toBeTruthy()
    expect(screen.queryByText(coverage.own)).toBeNull()
    expect(
      screen.queryByText(en.whatsappConnect.tab.costs.creditNote)
    ).toBeNull()
  })

  it('shows no coverage when the server sends no own-number rate', () => {
    presence.visible = true
    mockPage()
    renderPage('en')

    expect(screen.queryByText(coverage.own)).toBeNull()
  })
})
