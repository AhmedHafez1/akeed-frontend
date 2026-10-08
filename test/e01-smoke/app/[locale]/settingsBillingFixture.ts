import type {
  CodTemplateDefinition,
  SettingsResponse,
} from '@/features/settings/api/settingsApi'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'
import type {
  CreditSummary,
  LedgerEntry,
  PurchaseDetail,
  PurchaseSummary,
} from '@/features/billing'
import { ApiError } from '@/shared/lib/http'

/*
 * In-memory backend for the standalone Settings, Billing and payment-return
 * fixtures, which render the production pages inside the production sidebar
 * and top bar (/settings, /billing/credits, /billing/return). Query parameters
 * pick a scenario:
 *
 *   account=healthy | low | zero | suspended      the credit balance (healthy)
 *   outcome=successful | pending | failed | expired   the purchase returned to
 *   pending=1        the billing page opens on a purchase still being checked
 *   role=viewer      settings are read-only
 *   save=fail        PATCH /api/settings answers 500
 *
 * Saving keeps the new values for the page's lifetime. Nothing leaves the
 * browser.
 */

export function isSettingsBillingFixture() {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return (
    path.endsWith('/settings') ||
    path.endsWith('/billing/credits') ||
    path.endsWith('/billing/return')
  )
}

const param = (name: string) =>
  new URLSearchParams(window.location.search).get(name)

const DAY_MS = 86_400_000
const PURCHASE_REF = `akd_4e1f${'0'.repeat(24)}9b07`
/** Messages per day over the last 14 days, today last. */
const DAILY_USAGE = [9, 14, 11, 17, 8, 12, 21, 15, 13, 18, 10, 16, 22, 14]

function creditSummary(): CreditSummary {
  const account = param('account') ?? 'healthy'
  const suspended = account === 'suspended'
  const available = account === 'low' ? 42 : account === 'zero' ? 0 : 388
  return {
    billingEnabled: true,
    bulkImportEnabled: true,
    status: suspended ? 'suspended' : 'active',
    postedBalance: available,
    heldCredits: 0,
    availableCredits: available,
    debtCredits: 0,
    lowBalanceThreshold: 50,
    freeGrant: {
      granted: true,
      quantity: 30,
      grantedAt: '2026-08-01T10:00:00.000Z',
    },
    price: { unitPriceMinor: 200, currency: 'EGP' },
    range: { min: 100, max: 5000, step: 50 },
    canPurchase: !suspended,
    purchaseDenialReason: suspended ? 'CREDIT_ACCOUNT_SUSPENDED' : null,
  }
}

function purchase(
  status: PurchaseSummary['status'],
  createdAt: string
): PurchaseSummary {
  return {
    reference: PURCHASE_REF,
    status,
    disputeStatus: 'none',
    quantity: 500,
    unitPriceMinor: 200,
    totalMinor: 100_000,
    currency: 'EGP',
    refundedMinor: 0,
    reconciliationRequired: false,
    checkoutExpiresAt: null,
    createdAt,
    updatedAt: createdAt,
  }
}

/** Newest first: the last 14 days of sends, then the purchase behind them. */
function ledger(): LedgerEntry[] {
  const entries: LedgerEntry[] = []
  const now = Date.now()
  let balance = creditSummary().postedBalance
  for (let daysAgo = 0; daysAgo < DAILY_USAGE.length; daysAgo++) {
    const count = DAILY_USAGE[DAILY_USAGE.length - 1 - daysAgo]
    for (let index = 0; index < count; index++) {
      entries.push({
        id: `send-${daysAgo}-${index}`,
        type: 'consumption',
        quantity: -1,
        actorType: 'meta',
        reasonCode: 'message_accepted',
        postedBalanceAfter: balance,
        // A minute apart from midnight on, so today's rows are never ahead of now.
        createdAt: new Date(
          new Date(now - daysAgo * DAY_MS).setHours(0, index, 0, 0)
        ).toISOString(),
        purchaseRef: null,
      })
      balance += 1
    }
  }
  entries.push({
    id: 'purchase-1',
    type: 'purchase',
    quantity: 500,
    actorType: 'paymob',
    reasonCode: 'payment_verified',
    postedBalanceAfter: balance,
    createdAt: new Date(now - 19 * DAY_MS).toISOString(),
    purchaseRef: PURCHASE_REF,
  })
  return entries
}

const template = (
  greeting: string,
  body: string,
  totalLabel: string,
  ending: string,
  confirmButton: string,
  cancelButton: string
): TemplateMessage =>
  templateMessageFixture(
    [greeting, body, totalLabel, ending],
    [confirmButton, cancelButton]
  )

const variant = (
  language: 'ar' | 'en',
  id: CodTemplateDefinition['variant'],
  message: TemplateMessage
): CodTemplateDefinition => ({
  language,
  variant: id,
  metaTemplateName: `fixture_${language}_${id}`,
  metaLanguageCode: language,
  bodyParameterOrder: ['customer', 'store', 'order', 'total'],
  message: { ...message, direction: language === 'ar' ? 'rtl' : 'ltr' },
})

const AR_VARIANTS = [
  variant(
    'ar',
    'standard',
    template(
      'أهلًا بك {{customer}}،',
      'شكرًا لتسوّقك من {{store}}. طلبك رقم #{{order}} جاهز تقريبًا للشحن.',
      'إجمالي الطلب: {{total}}',
      'يرجى تأكيد الطلب لنتمكن من إرساله إليك بأسرع وقت.',
      'تأكيد الطلب',
      'إلغاء الطلب'
    )
  ),
  variant(
    'ar',
    'egyptian',
    template(
      'أهلًا {{customer}}،',
      'طلبك رقم #{{order}} من {{store}} مستني تأكيدك.',
      'إجمالي الطلب: {{total}}',
      'أكّد دلوقتي عشان نشحنه لك على طول.',
      'تأكيد وشحن',
      'إلغاء'
    )
  ),
  variant(
    'ar',
    'gulf',
    template(
      'أهلًا {{customer}}.',
      'طلبك رقم #{{order}} من {{store}} بانتظار تأكيدك.',
      'إجمالي الطلب: {{total}}',
      'ياليت تأكد الحين عشان نطلعه للشحن فورًا وما يتأخر عليك.',
      'اشحن طلبي',
      'إلغاء'
    )
  ),
  variant(
    'ar',
    'short',
    template(
      'السلام عليكم {{customer}}،',
      'تم استلام طلبك رقم #{{order}} من {{store}}، والدفع عند الاستلام {{total}}.',
      '',
      '',
      'تأكيد',
      'إلغاء'
    )
  ),
]

const EN_VARIANTS = [
  variant(
    'en',
    'friendly',
    template(
      'Hi {{customer}},',
      'Thanks for shopping with {{store}}. Your order #{{order}} is almost ready to ship.',
      'Order total: {{total}}',
      'Please confirm so we can send it your way.',
      'Confirm order',
      'Cancel order'
    )
  ),
  variant(
    'en',
    'professional',
    template(
      'Hello {{customer}},',
      'We have received your order #{{order}} from {{store}}.',
      'Order total: {{total}}',
      'Please confirm your cash-on-delivery order so we can ship it.',
      'Confirm order',
      'Cancel'
    )
  ),
  variant(
    'en',
    'direct',
    template(
      '{{customer}}, please confirm order #{{order}} from {{store}}.',
      'You pay {{total}} on delivery.',
      '',
      '',
      'Confirm & ship',
      'Cancel'
    )
  ),
  variant(
    'en',
    'short',
    template(
      'Order #{{order}} from {{store}}: {{total}} on delivery.',
      '',
      '',
      '',
      'Confirm',
      'Cancel'
    )
  ),
]

let savedState: Partial<SettingsResponse['state']> = {}
let savedVariants: Partial<SettingsResponse['template']['selected']> = {}

function settings(): SettingsResponse {
  const selected = { ar: 'gulf', en: 'friendly', ...savedVariants } as const
  return {
    state: {
      integrationId: 'fixture-source',
      source: {
        platformType: 'standalone',
        identity: 'akd_src_7f3c19e2b04a',
      },
      onboardingStatus: 'completed',
      isOnboardingComplete: true,
      storeName: 'Zam',
      defaultLanguage: 'auto',
      isAutoVerifyEnabled: true,
      assumeCodWhenPaymentMissing: false,
      shippingCurrency: 'EGP',
      avgShippingCost: 60,
      billingPlanId: null,
      billingStatus: 'not_required',
      billingManagement: { mode: 'manual', canManageBilling: false },
      followUpEnabled: true,
      followUpDelayMinutes: 120,
      escalationEnabled: true,
      escalationDelayMinutes: 480,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '09:00',
      timezone: 'Africa/Cairo',
      shopTimezone: null,
      sendDelayMinutes: 0,
      merchantWhatsappPhone: '+201148675077',
      testSendLanguage: 'ar',
      permissions: {
        canUpdateConfiguration: param('role') !== 'viewer',
        canCompleteOnboarding: false,
      },
      standaloneSetup: {
        canComplete: true,
        blockedReasons: [],
        accountStatus: 'active',
      },
      ...savedState,
    },
    billing: {
      plans: [],
      isFreePlanClaimed: false,
      usage: {
        used: 0,
        limit: 0,
        periodStart: '2026-10-01',
        periodEnd: null,
      },
    },
    template: {
      languages: ['ar', 'en'],
      defaultPreviewLanguage: 'ar',
      defaults: { ar: 'standard', en: 'friendly' },
      selected,
      variants: { ar: AR_VARIANTS, en: EN_VARIANTS },
      messages: {
        ar: AR_VARIANTS[0].message,
        en: EN_VARIANTS[0].message,
      },
    },
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function settingsBillingFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method ?? 'GET'
  if (url === '/api/settings' && method === 'GET')
    return Response.json(settings())
  if (url === '/api/billing/credits') return Response.json(creditSummary())
  if (url.startsWith('/api/billing/credits/ledger'))
    return Response.json({ items: ledger(), nextCursor: null, limit: 100 })
  if (url.startsWith('/api/billing/purchases?')) {
    const items = [
      purchase('successful', new Date(Date.now() - 19 * DAY_MS).toISOString()),
    ]
    if (param('pending') === '1')
      items.unshift({
        ...purchase('pending', new Date().toISOString()),
        reference: `akd_${'b'.repeat(32)}`,
      })
    return Response.json({ items, nextCursor: null, limit: 100 })
  }
  if (url.startsWith('/api/billing/purchases/') && method === 'GET') {
    const outcome = param('outcome') ?? 'successful'
    const status: PurchaseSummary['status'] =
      outcome === 'pending' || outcome === 'failed' || outcome === 'expired'
        ? outcome
        : 'successful'
    const detail: PurchaseDetail = purchase(status, '2026-10-01T05:52:00.000Z')
    return Response.json(detail)
  }
  if (url === '/api/billing/purchases' && method === 'POST') {
    await delay(600)
    return Response.json({
      ...purchase('pending', new Date().toISOString()),
      checkoutUrl: `${window.location.origin}${window.location.pathname.replace(
        /\/credits$/,
        '/return'
      )}?purchaseRef=${PURCHASE_REF}`,
      duplicate: false,
    })
  }
  if (url === '/api/onboarding/test' && method === 'POST') {
    await delay(600)
    return Response.json({})
  }
  if (url.startsWith('/api/order-imports'))
    return Response.json({ items: [], nextCursor: null })
  if (url.startsWith('/api/admin/'))
    return Response.json({ message: 'Not an admin' }, { status: 403 })
  throw new Error(`Unexpected settings fixture request: ${method} ${url}`)
}

export async function settingsBillingApi<T>(
  method: 'GET' | 'PATCH',
  url: string,
  data?: unknown
): Promise<T> {
  if (method === 'PATCH' && url === '/api/settings') {
    await delay(600)
    if (param('save') === 'fail')
      throw new ApiError('Synthetic save failure', 500)
    const { codTemplateArVariant, codTemplateEnVariant, ...state } = data as {
      codTemplateArVariant?: SettingsResponse['template']['selected']['ar']
      codTemplateEnVariant?: SettingsResponse['template']['selected']['en']
    } & Partial<SettingsResponse['state']>
    savedState = { ...savedState, ...state }
    savedVariants = {
      ...savedVariants,
      ...(codTemplateArVariant && { ar: codTemplateArVariant }),
      ...(codTemplateEnVariant && { en: codTemplateEnVariant }),
    }
    return settings() as T
  }
  if (url === '/api/onboarding/state')
    return {
      state: {
        isAutoVerifyEnabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '09:00',
        billingPlanId: null,
        activation: {
          setupCompletedAt: '2026-08-01T07:55:00.000Z',
          testSentAt: null,
          testConfirmedAt: null,
          testSkippedAt: null,
          firstRealConfirmedAt: '2026-08-02T07:55:00.000Z',
          hasRealOrders: true,
          isLive: true,
          needsPlan: false,
        },
        usage: null,
      },
    } as T
  if (url.startsWith('/api/verifications?'))
    return {
      data: [],
      next_cursor: null,
      total_count: 0,
      page_context: {
        source: { status: 'connected' },
        permissions: { can_create_manual_order: true },
        usage: { limit: 0, remaining: 0, credit_denial: null },
      },
    } as T
  throw new Error(`Unexpected settings fixture ${method}: ${url}`)
}
