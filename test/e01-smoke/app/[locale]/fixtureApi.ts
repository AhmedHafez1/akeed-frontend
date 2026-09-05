import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
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
  result: FixtureResult
  role: FixtureRole
  pending?: () => void
  counts: { cancellations: number; lists: number; stats: number }
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
    counts: { cancellations: 0, lists: 0, stats: 0 },
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

export const api = {
  async get<T>(url: string): Promise<T> {
    const fixture = getFixtureState()
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
    fixture.order.cancellation_operation = {
      status: 'pending_provider_operation',
      providerOperationId: 'e01-synthetic-job-reference',
    }
    fixture.order.status = 'canceled'
    fixture.order.canceled_at = '2026-05-17T12:00:00Z'
    const response = {
      success: true,
      status: 'canceled',
      verificationId: fixture.order.id,
      providerOperationId: 'e01-synthetic-job-reference',
      operation: fixture.order.cancellation_operation,
    } satisfies CancelOrderResponse
    return response as T
  },
}
