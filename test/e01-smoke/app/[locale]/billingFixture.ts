import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import type { OnboardingBillingResponse } from '@/features/onboarding/domain/onboarding.types'
import type {
  CreditSummary,
  LedgerEntry,
  PurchaseDetail,
  PurchaseSummary,
} from '@/features/billing'

let billingPosts = 0
let settingsReads = 0
let merchantPurchasePosts = 0
let merchantPurchaseReads = 0
let lastIdempotencyKey: string | null = null
const merchantIdempotencyKeys: string[] = []
export function billingFixtureCounts() {
  return {
    billingPosts,
    settingsReads,
    merchantPurchasePosts,
    merchantPurchaseReads,
    lastIdempotencyKey,
    merchantIdempotencyKeys: [...merchantIdempotencyKeys],
  }
}

const purchaseRef = `akd_${'a'.repeat(32)}`

function merchantCreditSummary(): CreditSummary {
  const search = new URLSearchParams(window.location.search)
  const account = search.get('account') ?? 'low'
  const viewer = search.get('role') === 'viewer'
  const status =
    account === 'pending'
      ? 'pending_approval'
      : account === 'suspended'
        ? 'suspended'
        : account === 'not-provisioned'
          ? 'not_provisioned'
          : 'active'
  const posted = account === 'zero' ? 2 : account === 'debt' ? -4 : 10
  const held = account === 'zero' || account === 'debt' ? 2 : 2
  return {
    billingEnabled: account !== 'disabled',
    status,
    postedBalance: posted,
    heldCredits: held,
    availableCredits: Math.max(posted - held, 0),
    debtCredits: Math.max(-posted, 0),
    lowBalanceThreshold: 10,
    freeGrant: {
      granted: status === 'active',
      quantity: 30,
      grantedAt: status === 'active' ? '2026-09-01T10:00:00.000Z' : null,
    },
    price: { unitPriceMinor: 200, currency: 'EGP' },
    range: { min: 100, max: 5000, step: 50 },
    canPurchase: account !== 'disabled' && status === 'active' && !viewer,
    purchaseDenialReason: viewer
      ? 'BILLING_PURCHASE_ROLE_REQUIRED'
      : account === 'disabled'
        ? 'BILLING_DISABLED'
        : status === 'pending_approval'
          ? 'STANDALONE_APPROVAL_REQUIRED'
          : status === 'suspended'
            ? 'CREDIT_ACCOUNT_SUSPENDED'
            : null,
  }
}

function merchantPurchase(
  status: PurchaseSummary['status'] = 'successful',
  reference = purchaseRef
): PurchaseSummary {
  return {
    reference,
    status,
    disputeStatus: 'none',
    quantity: 100,
    unitPriceMinor: 200,
    totalMinor: 20000,
    currency: 'EGP',
    refundedMinor: status === 'refunded' ? 20000 : 0,
    reconciliationRequired: false,
    checkoutExpiresAt: '2026-09-10T12:15:00.000Z',
    createdAt: '2026-09-10T12:00:00.000Z',
    updatedAt: '2026-09-10T12:01:00.000Z',
  } satisfies PurchaseSummary
}

const merchantLedger: LedgerEntry[] = [
  {
    id: 'ledger-payment',
    type: 'purchase',
    quantity: 100,
    actorType: 'paymob',
    reasonCode: 'payment_verified',
    postedBalanceAfter: 110,
    createdAt: '2026-09-10T12:01:00.000Z',
    purchaseRef,
  },
  {
    id: 'ledger-send',
    type: 'consumption',
    quantity: -1,
    actorType: 'meta',
    reasonCode: 'message_accepted',
    postedBalanceAfter: 10,
    createdAt: '2026-09-09T08:00:00.000Z',
    purchaseRef: null,
  },
]

function settings(): SettingsResponse {
  const mode =
    new URLSearchParams(window.location.search).get('entitlement') ?? 'manual'
  const shopify = mode === 'shopify'
  const preview = {
    greeting: 'Hello',
    body: 'Synthetic order',
    totalLabel: 'Total',
    ending: 'Please confirm',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  }
  return {
    state: {
      integrationId: 'e02-fixture-source',
      source: {
        platformType: shopify ? 'shopify' : 'standalone',
        identity: shopify
          ? 'synthetic.myshopify.com'
          : 'standalone:e02-fixture-org',
      },
      onboardingStatus: 'completed',
      isOnboardingComplete: true,
      storeName: 'E02 synthetic pilot',
      defaultLanguage: 'auto',
      isAutoVerifyEnabled: true,
      assumeCodWhenPaymentMissing: false,
      shippingCurrency: 'USD',
      avgShippingCost: 3,
      billingPlanId: 'starter',
      billingStatus:
        mode === 'blocked' ? 'frozen' : shopify ? 'active' : 'not_required',
      billingManagement:
        mode === 'missing'
          ? undefined
          : { mode: shopify ? 'shopify' : 'manual', canManageBilling: shopify },
      followUpEnabled: true,
      followUpDelayMinutes: 120,
      escalationEnabled: true,
      escalationDelayMinutes: 360,
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: 'Africa/Cairo',
      sendDelayMinutes: 0,
      permissions: {
        canUpdateConfiguration: true,
        canCompleteOnboarding: !shopify,
      },
      standaloneSetup: shopify
        ? null
        : { canComplete: true, blockedReasons: [], approvalStatus: null },
    },
    billing: {
      plans:
        shopify || mode === 'missing'
          ? [
              {
                id: 'starter',
                name: 'Akeed Starter',
                amount: 0,
                currencyCode: 'USD',
                includedVerifications: 30,
              },
              {
                id: 'basic',
                name: 'Akeed Basic',
                amount: 9.99,
                currencyCode: 'USD',
                includedVerifications: 300,
              },
              {
                id: 'pro',
                name: 'Akeed Pro',
                amount: 22.99,
                currencyCode: 'USD',
                includedVerifications: 1000,
              },
              {
                id: 'business',
                name: 'Akeed Scale',
                amount: 49.99,
                currencyCode: 'USD',
                includedVerifications: 2500,
              },
            ]
          : [],
      isFreePlanClaimed: false,
      usage: {
        used: 30,
        limit: 30,
        periodStart: '2026-09-01',
        periodEnd: '2026-10-01',
      },
    },
    template: {
      languages: ['ar', 'en'],
      defaultPreviewLanguage: 'en',
      defaults: { ar: 'standard', en: 'friendly' },
      selected: { ar: 'standard', en: 'friendly' },
      variants: { ar: [], en: [] },
      previews: { ar: preview, en: preview },
    },
  }
}

export async function billingFixtureRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (url === '/api/billing/credits') {
    if (new URLSearchParams(window.location.search).get('account') === 'error')
      return Response.json(
        { message: 'Synthetic summary error' },
        { status: 500 }
      )
    return Response.json(merchantCreditSummary())
  }
  if (url.startsWith('/api/billing/credits/ledger')) {
    const history = new URLSearchParams(window.location.search).get('history')
    if (history === 'error')
      return Response.json(
        { message: 'Synthetic history error' },
        { status: 500 }
      )
    const cursor = new URL(url, 'http://fixture.local').searchParams.get(
      'cursor'
    )
    return Response.json({
      items:
        history === 'empty'
          ? []
          : history === 'paged' && cursor
            ? merchantLedger.slice(1)
            : merchantLedger.slice(0, history === 'paged' ? 1 : undefined),
      nextCursor: history === 'paged' && !cursor ? 'ledger-page-2' : null,
      limit: 25,
    })
  }
  if (url.startsWith('/api/billing/purchases?')) {
    const history = new URLSearchParams(window.location.search).get('history')
    if (history === 'error')
      return Response.json(
        { message: 'Synthetic history error' },
        { status: 500 }
      )
    const cursor = new URL(url, 'http://fixture.local').searchParams.get(
      'cursor'
    )
    const purchase = merchantPurchase(
      history === 'refunded' ? 'refunded' : 'successful',
      cursor ? `akd_${'b'.repeat(32)}` : purchaseRef
    )
    if (history === 'dispute') purchase.disputeStatus = 'open'
    if (history === 'reconciliation') purchase.reconciliationRequired = true
    return Response.json({
      items: history === 'empty' ? [] : [purchase],
      nextCursor: history === 'paged' && !cursor ? 'purchase-page-2' : null,
      limit: 25,
    })
  }
  if (url.startsWith('/api/billing/purchases/') && options.method !== 'POST') {
    merchantPurchaseReads++
    const outcome = new URLSearchParams(window.location.search).get('outcome')
    const status =
      outcome === 'timeout' ||
      (outcome === 'success' && merchantPurchaseReads < 3)
        ? 'pending'
        : outcome === 'failed'
          ? 'failed'
          : outcome === 'canceled'
            ? 'canceled'
            : outcome === 'expired'
              ? 'expired'
              : outcome === 'refunded'
                ? 'refunded'
                : 'successful'
    const detail: PurchaseDetail = {
      ...merchantPurchase(status),
      reconciliationRequired: outcome === 'reconciliation',
    }
    return Response.json(detail)
  }
  if (url === '/api/billing/purchases' && options.method === 'POST') {
    merchantPurchasePosts++
    const headers = new Headers(options.headers)
    lastIdempotencyKey = headers.get('Idempotency-Key')
    if (lastIdempotencyKey) merchantIdempotencyKeys.push(lastIdempotencyKey)
    const outcome = new URLSearchParams(window.location.search).get('outcome')
    if (outcome === 'network') throw new TypeError('Synthetic network failure')
    if (outcome === 'unknown') {
      return Response.json(
        {
          code: 'BILLING_PROVIDER_UNAVAILABLE',
          message: 'Synthetic unknown outcome',
          reference: purchaseRef,
        },
        { status: 503 }
      )
    }
    const body = JSON.parse(String(options.body)) as { quantity: number }
    return Response.json({
      ...merchantPurchase('pending'),
      quantity: body.quantity,
      totalMinor: body.quantity * 200,
      checkoutUrl: `https://accept.paymob.test/checkout?reference=${purchaseRef}`,
      duplicate: false,
    })
  }
  if (url === '/api/settings' && options.method === 'GET') {
    settingsReads++
    return Response.json(settings())
  }
  if (url === '/api/onboarding/billing' && options.method === 'POST') {
    billingPosts++
    if (!settings().state.billingManagement?.canManageBilling)
      throw new Error('Blocked manual billing fixture request')
    const confirmation = new URL(window.location.href)
    confirmation.searchParams.set('approved', '1')
    const response = {
      confirmationUrl: confirmation.toString(),
    } satisfies OnboardingBillingResponse
    return Response.json(response)
  }
  throw new Error(`Blocked fixture request: ${options.method} ${url}`)
}
