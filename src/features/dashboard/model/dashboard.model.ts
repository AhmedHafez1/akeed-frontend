import type {
  CommerceOutcomeCapability,
  CommerceOutcomeOperationResult,
} from '@/shared/types/commerce-outcome.model'

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

export type ManualOrderLifecycleStatus =
  | 'accepted'
  | 'processing'
  | 'ineligible'
  | 'blocked'
  | VerificationStatus
  | 'review_required'

export type ManualOrderLifecycle = {
  status: ManualOrderLifecycleStatus
  reason: string | null
  verification_id: string | null
  retryable: boolean
}

export type VerificationStatusFilter =
  | 'all'
  | 'awaiting_response'
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
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
  capabilities?: CommerceOutcomeCapability[]
  cancellation_operation?: CommerceOutcomeOperationResult
  id: string
  status: VerificationStatus
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

export type OrderItem = {
  id: string
  order_number: string | null
  external_order_id: string
  customer_name: string | null
  customer_phone: string
  customer_email: string | null
  total_price: string | null
  currency: string | null
  created_at: string | null
  is_test: boolean
  source: {
    integration_id: string
    platform_type: string
  }
  verification_status: VerificationStatus | null
  verification: {
    id: string
    status: VerificationStatus
    capabilities: CommerceOutcomeCapability[]
    cancellation_operation?: CommerceOutcomeOperationResult
    last_sent_at: string | null
    delivered_at: string | null
    read_at: string | null
    confirmed_at: string | null
    canceled_at: string | null
    expired_at: string | null
    no_reply_at: string | null
    follow_up_attempts: number
    follow_up_sent_at: string | null
  } | null
  lifecycle: ManualOrderLifecycle
}

export type VerificationsResponse = {
  data: VerificationItem[]
  next_cursor: string | null
  page_context?: {
    source?: DashboardSourceState
    automation: {
      is_auto_verify_enabled: boolean
      follow_up_enabled: boolean
      quiet_hours_enabled: boolean
    }
    permissions?: {
      can_send_test_verification: boolean
      can_cancel_orders: boolean
      can_create_manual_order: boolean
      can_retry_verifications?: boolean
    }
  }
}

export type OrdersResponse = {
  data: OrderItem[]
  next_cursor: string | null
  total_count: number
  page_context?: VerificationsResponse['page_context'] & {
    reporting_timezone?: string
  }
}

export type StandaloneOrderFilter =
  | 'all'
  | 'in_progress'
  | 'needs_attention'
  | 'confirmed'
  | 'canceled'

export type DashboardStats = {
  date_range: DashboardStatsDateRange
  source?: DashboardSourceState
  automation: {
    is_auto_verify_enabled: boolean
    follow_up_enabled: boolean
    quiet_hours_enabled: boolean
  }
  totals: {
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

export type StandaloneDashboardStats = {
  date_range: DashboardStatsDateRange
  reporting_timezone: string
  source: DashboardSourceState
  automation: DashboardStats['automation']
  order_totals: {
    total: number
    in_progress: number
    needs_attention: number
    confirmed: number
    canceled: number
  }
  verification_totals: DashboardStats['totals']
  usage: DashboardStats['usage'] & {
    period_start: string | null
    period_end: string | null
  }
  savings: DashboardStats['savings']
}

export type StandaloneDashboardStatsResponse = {
  stats: StandaloneDashboardStats
}
