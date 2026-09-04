import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import type { CancelOrderResponse } from '@/shared/types/commerce-outcome.model'
import { billingFixtureRequest } from './billingFixture'
import { adminPilotFixtureRequest } from './adminPilotFixture'
import { onboardingFixtureRequest } from './onboardingFixture'

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

const order: VerificationItem = {
  id: 'e01-synthetic-verification',
  status: 'no_reply',
  capabilities: [{ action: 'merchant_no_reply_cancellation', supported: true }],
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
}

let result: 'failure' | 'success' = 'failure'
let pending: (() => void) | undefined
const counts = { cancellations: 0, lists: 0, stats: 0 }
export function setFixtureResult(value: 'failure' | 'success') {
  result = value
}
export function setFixtureCapability(value: string) {
  order.capabilities =
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
  pending?.()
  pending = undefined
}
export function fixtureCounts() {
  return { ...counts, pending: Boolean(pending) }
}

export const api = {
  async get<T>(url: string): Promise<T> {
    if (url.startsWith('/api/verifications/stats?')) {
      counts.stats++
      return { stats: null } as T
    }
    if (url.startsWith('/api/verifications?')) {
      counts.lists++
      return { data: [{ ...order }], next_cursor: null } as T
    }
    throw new Error(`Unexpected fixture GET: ${url}`)
  },
  async post<T>(url: string): Promise<T> {
    if (url !== '/api/verifications/e01-synthetic-verification/cancel') {
      throw new Error(`Blocked fixture POST: ${url}`)
    }
    counts.cancellations++
    await new Promise<void>((resolve) => {
      pending = resolve
    })
    if (result === 'failure') throw new Error('Synthetic cancellation failure')
    order.cancellation_operation = {
      status: 'pending_provider_operation',
      providerOperationId: 'e01-synthetic-job-reference',
    }
    order.status = 'canceled'
    order.canceled_at = '2026-05-17T12:00:00Z'
    const response = {
      success: true,
      status: 'canceled',
      verificationId: order.id,
      providerOperationId: 'e01-synthetic-job-reference',
      operation: order.cancellation_operation,
    } satisfies CancelOrderResponse
    return response as T
  },
}
