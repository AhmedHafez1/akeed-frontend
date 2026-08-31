import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

const order: VerificationItem = {
  id: 'e01-synthetic-verification',
  status: 'no_reply',
  order_id: 'e01-synthetic-order',
  order_number: 'E01-FIXTURE',
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
    order.status = 'canceled'
    order.canceled_at = '2026-05-17T12:00:00Z'
    return {
      success: true,
      status: 'canceled',
      verificationId: order.id,
      shopifyJobId: 'e01-synthetic-job-reference',
    } as T
  },
}
