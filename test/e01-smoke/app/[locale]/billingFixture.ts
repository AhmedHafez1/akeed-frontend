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

const merchantLedger: LedgerEntry[] = buildMerchantLedger()

/**
 * A ledger wide enough to exercise the operations log: two months of mixed
 * movement, so the type/period/status filters, the pager and the derived
 * "used this month" total all have something to act on. The two named entries
 * stay first and unchanged — they are the rows the billing page preview and
 * the Paymob return flow are read against.
 */
function buildMerchantLedger(): LedgerEntry[] {
  /*
   * Walked oldest-to-newest from a single opening balance so every row
   * satisfies the ledger's own invariant — `balanceAfter - quantity` equals
   * the previous row's `balanceAfter` — then reversed into the newest-first
   * order the API returns. Two months of mixed movement gives the operations
   * log's type, period and status filters, its pager and the derived
   * "used this month" total something real to act on.
   */
  const entries: LedgerEntry[] = []
  let balance = 12

  for (let index = 25; index >= 0; index--) {
    const day = new Date(Date.UTC(2026, 8, 8) - index * 86_400_000)
    const isPurchase = index % 7 === 3
    const isReversal = !isPurchase && index % 11 === 5
    const hex = ((index + 1) * 2654435761).toString(16).slice(-8)
    balance += isPurchase ? 50 : isReversal ? 1 : -1
    entries.push(
      isPurchase
        ? {
            id: `${hex}-4c1a-8f2b-a90d-purchase`,
            type: 'purchase',
            quantity: 50,
            actorType: 'paymob',
            reasonCode: 'payment_verified',
            postedBalanceAfter: balance,
            createdAt: day.toISOString(),
            purchaseRef: `akd_${hex}${'c'.repeat(24)}`,
          }
        : {
            id: `${hex}-4c1a-8f2b-a90d-${isReversal ? 'restore' : 'send'}`,
            type: isReversal ? 'failure_reversal' : 'consumption',
            quantity: isReversal ? 1 : -1,
            actorType: isReversal ? 'system' : 'meta',
            reasonCode: isReversal
              ? 'delivery_failure_restored'
              : 'message_accepted',
            postedBalanceAfter: balance,
            createdAt: day.toISOString(),
            purchaseRef: null,
          }
    )
  }

  // The two rows the billing preview and the Paymob return flow are read
  // against stay newest, and continue the same running balance.
  balance -= 1
  entries.push({
    id: 'ledger-send',
    type: 'consumption',
    quantity: -1,
    actorType: 'meta',
    reasonCode: 'message_accepted',
    postedBalanceAfter: balance,
    createdAt: '2026-09-09T08:00:00.000Z',
    purchaseRef: null,
  })
  balance += 100
  entries.push({
    id: 'ledger-payment',
    type: 'purchase',
    quantity: 100,
    actorType: 'paymob',
    reasonCode: 'payment_verified',
    postedBalanceAfter: balance,
    createdAt: '2026-09-10T12:01:00.000Z',
    purchaseRef,
  })

  return entries.reverse()
}

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
    /*
     * The operations log joins each purchase ledger entry to its summary by
     * reference, so every generated `purchaseRef` needs one here — otherwise
     * those rows would render without a settlement status.
     */
    const joined = merchantLedger
      .filter((entry) => entry.purchaseRef && entry.purchaseRef !== purchaseRef)
      .map((entry, index) =>
        merchantPurchase(
          index % 5 === 2 ? 'pending' : 'successful',
          entry.purchaseRef as string
        )
      )
    return Response.json({
      items: history === 'empty' ? [] : [purchase, ...joined],
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
