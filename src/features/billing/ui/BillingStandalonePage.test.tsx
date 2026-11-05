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
const history = vi.hoisted(() => ({
  transactions: [] as unknown[],
  purchases: [],
  isComplete: true,
  isWindowCovered: true,
  isLoading: false,
  isDraining: false,
  error: false,
  reload: async () => undefined,
}))
vi.mock('../domain/useTransactions', () => ({
  useTransactions: () => history,
}))
vi.mock('./components/CreditModelNoticeBanner', () => ({
  CreditModelNoticeBanner: () => null,
}))

type PageState = ReturnType<typeof useBillingPage>

const summary: CreditSummary = {
  billingEnabled: true,
  status: 'active',
  postedBalance: 388,
  heldCredits: 0,
  availableCredits: 388,
  debtCredits: 0,
  lowBalanceThreshold: 50,
  freeGrant: { granted: true, quantity: 30, grantedAt: null },
  price: {
    unitPriceMinor: 100,
    messagePriceMinor: 200,
    creditsPerMessage: 2,
    currency: 'EGP',
  },
  range: { min: 100, max: 5000, step: 50 },
  canPurchase: true,
  purchaseDenialReason: null,
}

const lastPurchase: PurchaseSummary = {
  reference: 'akd_0123456789abcdef0123456789abcdef',
  status: 'successful',
  disputeStatus: 'none',
  quantity: 500,
  unitPriceMinor: 200,
  totalMinor: 100_000,
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
    selectedPackage: 500,
    selectPackage: vi.fn(),
    quantityInput: '500',
    setQuantityInput: vi.fn(),
    quantity: 500,
    quantityError: null,
    totalMinor: 100_000,
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

const RUNWAY = 'يكفي حوالي 36 يومًا بمعدل استخدامك هذا الشهر.'
const PAUSED = 'التأكيدات للطلبات الجديدة متوقفة حتى تشحن الرصيد.'

beforeEach(() => {
  // The 20th: 212 used so far is 10.6 a day, so 388 lasts 36 days.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 12))
  vi.mocked(useBillingUsage).mockReturnValue(readyUsage)
  mockPage()
})

afterEach(() => {
  vi.useRealTimers()
  presence.visible = false
  history.transactions = []
  testLocale.current = 'ar'
})

describe('BillingStandalonePage (ar)', () => {
  it('shows a healthy balance with its runway, stats and one Pay button', () => {
    const { container } = renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'الفوترة والرصيد' })
    ).toBeTruthy()
    const hero = screen.getByText('388')
    expect(hero.className).toContain('text-brand')
    expect(screen.getByText('الرصيد كافٍ')).toBeTruthy()
    expect(screen.getByText(RUNWAY)).toBeTruthy()

    // The pill already says it, so a healthy balance has no banner.
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()

    expect(screen.getByText('212')).toBeTruthy()
    expect(screen.getByText('· 12 سبتمبر')).toBeTruthy()
    expect(screen.getAllByText('1.00 ج.م').length).toBe(2)

    const selected = screen.getByRole('radio', { checked: true })
    expect(selected.textContent).toContain('500')
    expect(selected.textContent).toContain('500.00 ج.م')
    expect(screen.getByText('من 100 إلى 5,000 رصيد، بخطوات قدرها 50.'))

    const pay = screen.getByRole('button', { name: 'ادفع 1,000.00 ج.م' })
    expect(pay).toHaveProperty('disabled', false)
    expect(container.querySelectorAll('button.bg-brand').length).toBe(1)
    expect(
      screen.getByText('رصيدك بعد الشراء', { exact: false }).textContent
    ).toBe('رصيدك بعد الشراء 888 رصيد')
  })

  it('warns once, under the card, when the balance is low', () => {
    mockPage({ availableCredits: 42, postedBalance: 42 })
    renderPage()

    expect(screen.getByText('42').className).toContain('text-ak-warning')
    expect(screen.getByText('الرصيد منخفض')).toBeTruthy()
    const banner = screen.getByRole('status')
    expect(banner.textContent).toContain('بقي 42 رصيد فقط')
    expect(banner.className).toContain('bg-ak-warning-soft')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('says confirmations are paused when the balance is empty', () => {
    mockPage({ availableCredits: 0, postedBalance: 0 })
    renderPage()

    expect(screen.getByText('نفد الرصيد')).toBeTruthy()
    expect(screen.getByText(PAUSED)).toBeTruthy()
    expect(screen.queryByText(RUNWAY)).toBeNull()
    const banner = screen.getByRole('alert')
    expect(banner.textContent).toContain('نفد رصيد الرسائل')
    expect(banner.className).toContain('bg-ak-danger-soft')
    // An empty balance is exactly when buying must stay open.
    expect(
      screen.getByRole('button', { name: 'ادفع 1,000.00 ج.م' })
    ).toHaveProperty('disabled', false)
  })

  it('holds Pay and points to the purchase status while one is pending', () => {
    mockPage({}, { pendingReference: 'akd_0123456789abcdef', isLocked: true })
    renderPage()

    const note = screen.getByRole('status')
    expect(note.textContent).toContain('لديك عملية شراء قيد التحقق')
    expect(
      screen.getByRole('link', { name: 'عرض حالة الشراء' }).getAttribute('href')
    ).toBe('/ar/billing/return?purchaseRef=akd_0123456789abcdef')
    expect(
      screen.getByRole('button', { name: 'ادفع 1,000.00 ج.م' })
    ).toHaveProperty('disabled', true)
    expect(
      screen.getByRole('button', { name: 'بدء عملية شراء جديدة' })
    ).toBeTruthy()
    for (const tile of screen.getAllByRole('radio'))
      expect(tile).toHaveProperty('disabled', true)
  })

  it('shows no placeholder number while usage loads', () => {
    vi.mocked(useBillingUsage).mockReturnValue({ status: 'loading' })
    renderPage()

    expect(screen.getByText('استخدمت هذا الشهر')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText(RUNWAY)).toBeNull()
    expect(screen.getByText('388')).toBeTruthy()
  })

  it('disables buying for a read-only member and says why', () => {
    mockPage({ canPurchase: false })
    renderPage()

    expect(
      screen.getByText(
        'لديك صلاحية العرض فقط. يستطيع المالك أو المدير شراء الرصيد.'
      )
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'ادفع 1,000.00 ج.م' })
    ).toHaveProperty('disabled', true)
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

    expect(
      screen.getByRole('button', { name: 'Pay EGP 1,000.00' })
    ).toBeTruthy()
    expect(screen.getByText('Lasts about 36 days at this month’s pace.'))
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
    expect(screen.getByText('124')).toBeTruthy()
    expect(screen.getByText('146')).toBeTruthy()
    expect(screen.getByText('1 credit / message')).toBeTruthy()
    expect(screen.getByText('2 credits / message')).toBeTruthy()
    expect(screen.getByText(balance.senders.usageNote)).toBeTruthy()
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

  it('lists the latest transactions with the own-number pack note', () => {
    history.transactions = [
      {
        id: 'tx-1',
        kind: 'usage',
        ledgerType: 'own_number_pack',
        reasonCode: 'own_number_messages',
        actorType: 'system',
        quantity: -2,
        balanceAfter: 842,
        createdAt: new Date(2026, 9, 20, 10, 42).toISOString(),
        reference: null,
        purchase: null,
      },
    ]
    renderPage('en')
    const tx = en.billing.transactions
    expect(screen.getByText(tx.types.own_number_pack)).toBeTruthy()
    expect(screen.getByText(tx.packNote)).toBeTruthy()
    expect(screen.getByText('842')).toBeTruthy()
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

    expect(
      screen.getByText(
        "Pays for about 250 messages from Akeed's number, or 500 from your number"
      )
    ).toBeTruthy()
    expect(screen.getByText(coverage.akeed)).toBeTruthy()
    expect(screen.getByText(coverage.own)).toBeTruthy()
    expect(screen.getAllByText('≈ 250').length).toBeGreaterThan(0)
    expect(screen.getAllByText('≈ 500').length).toBeGreaterThan(0)
    // Beside the coverage figures, as well as under the balance card’s rates.
    expect(screen.getAllByText(coverage.metaNote)).toHaveLength(2)
  })

  it('keeps recharge as it was while the own number is not offered', () => {
    mockPage(withOwnRate)
    renderPage('en')

    expect(screen.queryByText(coverage.akeed)).toBeNull()
    expect(screen.queryByText(coverage.metaNote)).toBeNull()
  })

  it('shows no coverage when the server sends no own-number rate', () => {
    presence.visible = true
    mockPage()
    renderPage('en')

    expect(screen.queryByText(coverage.akeed)).toBeNull()
  })
})
