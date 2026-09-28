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
 * An imported order that has no verification yet: `awaiting_start` until
 * the merchant starts it, `not_started` if it was withdrawn instead,
 * `queued` behind a release that has started, and `sending` once released
 * to the worker. Nothing has reached the customer in any of them.
 */
export type HoldLifecycleStatus =
  | 'awaiting_start'
  | 'not_started'
  | 'queued'
  | 'sending'

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
  | 'merchant_manual_confirmation'

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
  /** Set while a pending row waits for quiet hours or a send delay. */
  scheduled_for?: string | null
  /** The order's id on its platform, for linking to it in the store admin. */
  external_order_id?: string | null
  platform?: string | null
  /** Why the merchant should act; decided by the server, never re-derived. */
  action_reason?: NeedsActionReason | null
  /** WhatsApp error code when delivery failed, e.g. 131026. */
  failure_code?: string | null
  confirmation_source?: 'customer' | 'merchant_manual' | null
  cancellation_source?: string | null
  /** Akeed also canceled the order in the store. */
  canceled_in_store?: boolean
  updated_at?: string | null
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
  /** Rows per confirmations tab for the period, search ignored. */
  tab_counts?: Record<ConfirmationsTab, number>
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
    /** Real orders Akeed confirmed since the usage period started. */
    confirmed_in_period?: number
    confirmed_value_in_period?: string
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

/** Why the server says a row needs the merchant. */
export type NeedsActionReason =
  | 'delivery_failed'
  | 'no_reply_after_follow_up'
  | 'read_no_reply'
  | 'no_reply'

/** Tabs of the embedded confirmations list, each a server-side filter. */
export type ConfirmationsTab =
  | 'all'
  | 'needs_action'
  | 'confirmed'
  | 'canceled'
  | 'failed'

export type FunnelStep = {
  count: number
  /** Share of sent, 0-100; null when nothing was sent. */
  percent_of_sent: number | null
}

export type NeedsActionItem = {
  verification_id: string
  order_id: string
  external_order_id: string | null
  platform: string | null
  order_number: string | null
  customer_name: string | null
  customer_phone: string | null
  total_price: string | null
  currency: string | null
  reason: {
    type: NeedsActionReason
    since: string | null
    hours: number | null
    failure_code: string | null
  }
  capabilities: VerificationRowCapability[]
}

export type UsageState = 'ok' | 'warning' | 'exhausted'

/** GET /api/verifications/overview: everything the embedded dashboard shows. */
export type DashboardOverview = {
  date_range: DashboardStatsDateRange
  reporting_timezone: string
  source: DashboardSourceState
  settings: {
    auto_verify_enabled: boolean
    follow_up_enabled: boolean
    follow_up_delay_minutes: number
    quiet_hours_enabled: boolean
    quiet_hours_start: string | null
    quiet_hours_end: string | null
  }
  usage: {
    used: number
    limit: number
    percent: number
    state: UsageState
  } | null
  kpis: {
    confirmed: {
      count: number
      value: Array<{ currency: string; amount: string }>
    }
    canceled_before_shipping: { count: number }
    confirmation_rate: {
      rate: number | null
      confirmed: number
      sent: number
    }
  }
  funnel: {
    sent: FunnelStep
    delivered: FunnelStep
    read: FunnelStep
    replied: FunnelStep
    confirmed: number
    customer_canceled: number
    no_reply_yet: number
  }
  needs_action: {
    count: number
    items: NeedsActionItem[]
  }
  /** Whether this user may confirm orders by hand (viewers may not). */
  permissions?: { can_confirm_orders: boolean }
}

export type DashboardOverviewResponse = {
  overview: DashboardOverview
}
