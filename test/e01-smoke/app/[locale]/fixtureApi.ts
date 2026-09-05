import type {
  OrderItem,
  StandaloneDashboardStats,
  VerificationItem,
} from '@/features/dashboard/model/dashboard.model'
import type { CancelOrderResponse } from '@/shared/types/commerce-outcome.model'
import { ApiError } from '@/shared/lib/http'
import { billingFixtureRequest } from './billingFixture'
import { adminPilotFixtureRequest } from './adminPilotFixture'
import { onboardingFixtureRequest } from './onboardingFixture'
import { manualOrderFixtureRequest } from './manual-order/manualOrderFixture'

export { resetPilotFixture } from './adminPilotFixture'

export function fetchWithAuth(url: string, options: RequestInit = {}) {
  return [
    '/api/onboarding/state',
    '/api/onboarding/settings',
    '/api/onboarding/complete',
  ].includes(url)
    ? onboardingFixtureRequest(url, options)
    : url.startsWith('/api/admin/')
      ? adminPilotFixtureRequest(url, options)
      : billingFixtureRequest(url, options)
}

type FixtureResult = 'failure' | 'role_denied' | 'success'
type FixtureRole = 'owner' | 'admin' | 'viewer'
type FixtureState = {
  order: VerificationItem
  retryOrderStatus: OrderItem['lifecycle']['status']
  result: FixtureResult
  role: FixtureRole
  pending?: () => void
  counts: {
    cancellations: number
    lists: number
    retries: number
    stats: number
  }
}

const fixtureGlobal = globalThis as typeof globalThis & {
  __akeedCancellationFixture?: FixtureState
}

function getFixtureState(): FixtureState {
  fixtureGlobal.__akeedCancellationFixture ??= {
    order: {
      id: 'e01-synthetic-verification',
      status: 'no_reply',
      capabilities: [
        { action: 'merchant_no_reply_cancellation', supported: true },
      ],
      order_id: 'e01-synthetic-order',
      order_number: 'E01-FIXTURE',
      is_test: false,
      customer_name: 'Synthetic fixture',
      customer_phone: null,
      total_price: '12.50',
      currency: 'USD',
      created_at: '2026-05-15T12:00:00Z',
      last_sent_at: null,
      delivered_at: null,
      read_at: null,
      confirmed_at: null,
      canceled_at: null,
      expired_at: null,
      no_reply_at: '2026-05-16T12:00:00Z',
      follow_up_attempts: 1,
      follow_up_sent_at: null,
    },
    result: 'failure',
    role: 'owner',
    retryOrderStatus: 'blocked',
    counts: { cancellations: 0, lists: 0, retries: 0, stats: 0 },
  }
  return fixtureGlobal.__akeedCancellationFixture
}

function getSelectedRole(fixture: FixtureState): FixtureRole {
  if (typeof document === 'undefined') return fixture.role
  const value = (
    document.getElementById('fixture-role') as HTMLSelectElement | null
  )?.value
  return value === 'owner' || value === 'admin' || value === 'viewer'
    ? value
    : fixture.role
}

function getSelectedResult(fixture: FixtureState): FixtureResult {
  if (typeof document === 'undefined') return fixture.result
  const value = (
    document.getElementById('fixture-result') as HTMLSelectElement | null
  )?.value
  return value === 'failure' || value === 'role_denied' || value === 'success'
    ? value
    : fixture.result
}

function isStandaloneFixture(): boolean {
  if (typeof document === 'undefined') return false
  return (
    (document.getElementById('fixture-skin') as HTMLSelectElement | null)
      ?.value === 'standalone'
  )
}

export function setFixtureResult(value: FixtureResult) {
  getFixtureState().result = value
}
export function setFixtureRole(value: FixtureRole) {
  getFixtureState().role = value
}
export function setFixtureCapability(value: string) {
  getFixtureState().order.capabilities =
    value === 'legacy'
      ? undefined
      : [
          {
            action: 'merchant_no_reply_cancellation',
            supported: value === 'supported',
          },
        ]
}
export function settleFixture() {
  const fixture = getFixtureState()
  fixture.pending?.()
  fixture.pending = undefined
}
export function fixtureCounts() {
  const fixture = getFixtureState()
  return { ...fixture.counts, pending: Boolean(fixture.pending) }
}

function standaloneOrders(fixture: FixtureState): OrderItem[] {
  const verification = fixture.order
  const retryPending = fixture.retryOrderStatus === 'pending'
  return [
    {
      id: verification.order_id,
      order_number: verification.order_number,
      external_order_id: 'fixture:no-reply',
      customer_name: verification.customer_name,
      customer_phone: verification.customer_phone ?? '+201000000001',
      customer_email: null,
      total_price: verification.total_price,
      currency: verification.currency,
      created_at: verification.created_at,
      is_test: verification.is_test,
      source: {
        integration_id: 'fixture-source',
        platform_type: 'standalone',
      },
      verification_status: verification.status,
      verification: {
        id: verification.id,
        status: verification.status,
        capabilities: verification.capabilities ?? [],
        cancellation_operation: verification.cancellation_operation,
        last_sent_at: verification.last_sent_at,
        delivered_at: verification.delivered_at,
        read_at: verification.read_at,
        confirmed_at: verification.confirmed_at,
        canceled_at: verification.canceled_at,
        expired_at: verification.expired_at,
        no_reply_at: verification.no_reply_at,
        follow_up_attempts: verification.follow_up_attempts,
        follow_up_sent_at: verification.follow_up_sent_at,
      },
      lifecycle: {
        status: verification.status,
        reason: null,
        verification_id: verification.id,
        retryable: false,
      },
    },
    {
      id: 'e01-retry-order',
      order_number: 'E01-RETRY',
      external_order_id: 'fixture:retry',
      customer_name: 'Synthetic test customer',
      customer_phone: '+201000000002',
      customer_email: null,
      total_price: '25.00',
      currency: 'USD',
      created_at: '2026-05-16T12:00:00Z',
      is_test: true,
      source: {
        integration_id: 'fixture-source',
        platform_type: 'standalone',
      },
      verification_status: retryPending ? 'pending' : null,
      verification: retryPending
        ? {
            id: 'e01-retry-verification',
            status: 'pending',
            capabilities: [],
            last_sent_at: null,
            delivered_at: null,
            read_at: null,
            confirmed_at: null,
            canceled_at: null,
            expired_at: null,
            no_reply_at: null,
            follow_up_attempts: 0,
            follow_up_sent_at: null,
          }
        : null,
      lifecycle: {
        status: fixture.retryOrderStatus,
        reason: retryPending ? null : 'plan_limit_reached',
        verification_id: retryPending ? 'e01-retry-verification' : null,
        retryable: !retryPending,
      },
    },
  ]
}

function standaloneStats(fixture: FixtureState): StandaloneDashboardStats {
  const dashboardOrders = standaloneOrders(fixture)
  const countStatuses = (statuses: Array<OrderItem['lifecycle']['status']>) =>
    dashboardOrders.filter((order) => statuses.includes(order.lifecycle.status))
      .length
  return {
    date_range: 'last_30_days',
    reporting_timezone: 'Africa/Cairo',
    source: {
      status: 'connected',
      integration_id: 'fixture-source',
      platform_type: 'standalone',
    },
    automation: {
      is_auto_verify_enabled: true,
      follow_up_enabled: true,
      quiet_hours_enabled: false,
    },
    order_totals: {
      total: dashboardOrders.length,
      in_progress: countStatuses([
        'accepted',
        'processing',
        'pending',
        'sent',
        'delivered',
        'read',
      ]),
      needs_attention: countStatuses([
        'ineligible',
        'blocked',
        'failed',
        'expired',
        'no_reply',
        'review_required',
      ]),
      confirmed: countStatuses(['confirmed']),
      canceled: countStatuses(['canceled']),
    },
    verification_totals: {
      pending: fixture.retryOrderStatus === 'pending' ? 1 : 0,
      failed: 0,
      awaiting_reply: fixture.order.status === 'no_reply' ? 1 : 0,
      confirmed: 0,
      canceled: fixture.order.status === 'canceled' ? 1 : 0,
      customer_canceled: 0,
      sent: 1,
      delivered: 0,
      read: 0,
      follow_ups_sent: 1,
      reply_rate: 0,
      confirmation_rate: 0,
    },
    usage: {
      used: 2,
      limit: 100,
      period_start: '2026-05-01T00:00:00Z',
      period_end: '2026-06-01T00:00:00Z',
    },
    savings: {
      avg_shipping_cost: 3,
      currency: 'USD',
      money_saved: fixture.order.status === 'canceled' ? 3 : 0,
    },
  }
}

export const api = {
  async get<T>(url: string): Promise<T> {
    const fixture = getFixtureState()
    if (url.startsWith('/api/orders/stats?')) {
      fixture.counts.stats++
      return { stats: standaloneStats(fixture) } as T
    }
    if (url.startsWith('/api/orders?')) {
      fixture.counts.lists++
      const selectedRole = getSelectedRole(fixture)
      const canWrite = selectedRole === 'owner' || selectedRole === 'admin'
      const requestedStatuses = new URL(
        url,
        'http://fixture.local'
      ).searchParams
        .get('status')
        ?.split(',')
      const dashboardOrders = standaloneOrders(fixture).filter(
        (order) =>
          !requestedStatuses ||
          requestedStatuses.includes(order.lifecycle.status)
      )
      return {
        data: dashboardOrders,
        next_cursor: null,
        total_count: dashboardOrders.length,
        page_context: {
          source: {
            status: 'connected',
            integration_id: 'fixture-source',
            platform_type: 'standalone',
          },
          reporting_timezone: 'Africa/Cairo',
          automation: {
            is_auto_verify_enabled: true,
            follow_up_enabled: true,
            quiet_hours_enabled: false,
          },
          permissions: {
            can_send_test_verification: canWrite,
            can_cancel_orders: canWrite,
            can_create_manual_order: canWrite,
            can_retry_verifications: canWrite,
          },
        },
      } as T
    }
    if (url.startsWith('/api/verifications/stats?')) {
      fixture.counts.stats++
      return { stats: null } as T
    }
    if (url.startsWith('/api/verifications?')) {
      fixture.counts.lists++
      const selectedRole = getSelectedRole(fixture)
      const canWrite = selectedRole === 'owner' || selectedRole === 'admin'
      return {
        data: [{ ...fixture.order }],
        next_cursor: null,
        page_context: {
          source: {
            status: 'connected',
            integration_id: 'fixture-source',
            platform_type: 'standalone',
          },
          automation: {
            is_auto_verify_enabled: true,
            follow_up_enabled: true,
            quiet_hours_enabled: false,
          },
          permissions: {
            can_send_test_verification: canWrite,
            can_cancel_orders: canWrite,
            can_create_manual_order: canWrite,
          },
        },
      } as T
    }
    throw new Error(`Unexpected fixture GET: ${url}`)
  },
  async post<T>(
    url: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    if (url === '/api/orders') {
      return manualOrderFixtureRequest<T>(data, options)
    }
    const fixture = getFixtureState()
    if (url === '/api/orders/e01-retry-order/verification/retry') {
      fixture.counts.retries++
      await new Promise<void>((resolve) => {
        fixture.pending = resolve
      })
      const selectedResult = getSelectedResult(fixture)
      if (selectedResult === 'failure') {
        throw new Error('Synthetic retry failure')
      }
      if (selectedResult === 'role_denied') {
        throw new ApiError(
          'Owner or admin role is required to retry verification.',
          403,
          'MANUAL_ORDER_RETRY_ROLE_REQUIRED'
        )
      }
      fixture.retryOrderStatus = 'pending'
      return {
        orderId: 'e01-retry-order',
        verificationId: 'e01-retry-verification',
        lifecycle: {
          status: 'pending',
          reason: null,
          verification_id: 'e01-retry-verification',
          retryable: false,
        },
        duplicate: false,
      } as T
    }
    if (url !== '/api/verifications/e01-synthetic-verification/cancel') {
      throw new Error(`Blocked fixture POST: ${url}`)
    }
    fixture.counts.cancellations++
    await new Promise<void>((resolve) => {
      fixture.pending = resolve
    })
    const selectedResult = getSelectedResult(fixture)
    if (selectedResult === 'failure') {
      throw new Error('Synthetic cancellation failure')
    }
    if (selectedResult === 'role_denied') {
      throw new ApiError(
        'Owner or admin role is required to cancel an order.',
        403,
        'VERIFICATION_ROLE_REQUIRED'
      )
    }
    fixture.order.cancellation_operation = isStandaloneFixture()
      ? { status: 'applied' }
      : {
          status: 'pending_provider_operation',
          providerOperationId: 'e01-synthetic-job-reference',
        }
    fixture.order.status = 'canceled'
    fixture.order.canceled_at = '2026-05-17T12:00:00Z'
    const response = {
      success: true,
      status: 'canceled',
      verificationId: fixture.order.id,
      ...(fixture.order.cancellation_operation.status ===
      'pending_provider_operation'
        ? {
            providerOperationId:
              fixture.order.cancellation_operation.providerOperationId,
          }
        : {}),
      operation: fixture.order.cancellation_operation,
    } satisfies CancelOrderResponse
    return response as T
  },
}
