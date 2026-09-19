import type { CreditDenialCode } from '@/shared/lib/creditFeedback'
import type { CommerceOutcomeOperationResult } from '@/shared/types/commerce-outcome.model'

/**
 * The values the backend's `verification_status` enum can hold.
 *
 * Both runtime modes read the same `/api/verifications` endpoint, so there is
 * no second lifecycle to reconcile. The filter vocabulary is built from these.
 */
export type VerificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'confirmed'
  | 'canceled'
  | 'expired'
  | 'failed'
  | 'no_reply'

/**
 * An order that exists but was held before any message: `awaiting_start`
 * until the merchant starts it, `not_started` if it was withdrawn instead.
 * Nothing has been sent in either state.
 */
export type HoldLifecycleStatus = 'awaiting_start' | 'not_started'

/** Every status a dashboard row can be rendered in. */
export type LifecycleStatus = VerificationStatus | HoldLifecycleStatus

/**
 * Row actions the API reports as available.
 *
 * Rendered from the server's answer rather than inferred from the status, so
 * an action can never appear in one runtime mode and be missing in the other.
 */
export type VerificationRowAction =
  | 'merchant_no_reply_cancellation'
  | 'retry_verification'

export type VerificationRowCapability = {
  action: VerificationRowAction
  supported: boolean
}

/**
 * The filter ids the dashboard renders.
 *
 * Every single status is a filter — the standalone list narrows an outcome
 * down to its lifecycle stages, labelled from `verificationStatus.*` — plus
 * the composites that stand for several statuses at once. Only the ids in
 * `VERIFICATION_STATUS_FILTER_IDS` carry `filters.status.*` labels.
 */
export type VerificationStatusFilter =
  | 'all'
  | 'in_progress'
  | 'needs_attention'
  | 'awaiting_response'
  | VerificationStatus

export type DashboardStatsDateRange =
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_3_months'

export type DashboardSourceStatus =
  | 'connected'
  | 'disconnected'
  | 'not_connected'

export type DashboardSourceState = {
  status: DashboardSourceStatus
  integration_id: string | null
  platform_type: string | null
}

export type VerificationItem = {
  capabilities?: VerificationRowCapability[]
  cancellation_operation?: CommerceOutcomeOperationResult
  id: string
  status: LifecycleStatus
  /**
   * Why the verification is where it is, when the backend recorded a cause.
   * Carries the explanation without adding a status word for it.
   */
  reason: string | null
  order_id: string
  order_number: string | null
  is_test: boolean
  customer_name: string | null
  customer_phone: string | null
  total_price: string | null
  currency: string | null
  created_at: string | null
  last_sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  confirmed_at: string | null
  canceled_at: string | null
  expired_at: string | null
  no_reply_at: string | null
  follow_up_attempts: number
  follow_up_sent_at: string | null
  /**
   * Client-only: set on a row the UI is showing ahead of the server — an order
   * the merchant just created whose verification a worker has not written yet.
   * The API never sends it, and a row carrying it offers no actions.
   */
  optimistic?: 'submitting' | 'queued'
}

export type DashboardPermissions = {
  can_send_test_verification: boolean
  can_cancel_orders: boolean
  can_create_manual_order: boolean
  can_retry_verifications?: boolean
}

export type DashboardPageUsage = {
  credit_denial?: CreditDenialCode | null
  used: number
  limit: number
  remaining: number
  period_end: string | null
}

export type DashboardPageContext = {
  source?: DashboardSourceState
  reporting_timezone?: string
  automation: {
    is_auto_verify_enabled: boolean
    follow_up_enabled: boolean
    quiet_hours_enabled: boolean
  }
  permissions?: DashboardPermissions
  usage?: DashboardPageUsage
}

export type VerificationsResponse = {
  data: VerificationItem[]
  next_cursor: string | null
  total_count?: number
  page_context?: DashboardPageContext
}

export type DashboardStats = {
  date_range: DashboardStatsDateRange
  reporting_timezone?: string
  source?: DashboardSourceState
  automation: {
    is_auto_verify_enabled: boolean
    follow_up_enabled: boolean
    quiet_hours_enabled: boolean
  }
  totals: {
    total: number
    in_progress: number
    needs_attention: number
    pending: number
    failed: number
    awaiting_reply: number
    confirmed: number
    canceled: number
    customer_canceled: number
    sent: number
    delivered: number
    read: number
    follow_ups_sent: number
    reply_rate: number
    confirmation_rate: number
  }
  usage: {
    used: number
    limit: number
    period_start: string | null
    period_end: string | null
  }
  savings: {
    avg_shipping_cost: number
    currency: string
    money_saved: number
  }
}

export type DashboardStatsResponse = {
  stats: DashboardStats
}
