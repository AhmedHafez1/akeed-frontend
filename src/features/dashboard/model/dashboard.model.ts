import type { CommerceOutcomeOperationResult } from '@/shared/types/commerce-outcome.model'

/**
 * The only status vocabulary the dashboard speaks.
 *
 * These are exactly the values the backend's `verification_status` enum can
 * hold. Both runtime modes read the same `/api/verifications` endpoint, so
 * there is no second, wider lifecycle to reconcile: an order that has not
 * reached a verification yet is simply not in the list, in either mode.
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
 * The filter ids the dashboard actually renders.
 *
 * `sent` / `delivered` / `read` are deliberately absent: they are covered by
 * `awaiting_response`, and the message catalogues carry no labels for them, so
 * declaring them here would only invite a missing-translation error.
 */
export type VerificationStatusFilter =
  | 'all'
  | 'pending'
  | 'awaiting_response'
  | 'confirmed'
  | 'canceled'
  | 'failed'
  | 'no_reply'

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
  status: VerificationStatus
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
}

export type DashboardPermissions = {
  can_send_test_verification: boolean
  can_cancel_orders: boolean
  can_create_manual_order: boolean
  can_retry_verifications?: boolean
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
