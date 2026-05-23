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

export type VerificationItem = {
  id: string
  status: VerificationStatus
  order_id: string
  order_number: string | null
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
  verification_status: VerificationStatus | null
}

export type VerificationsResponse = {
  data: VerificationItem[]
  next_cursor: string | null
  page_context?: {
    automation: {
      is_auto_verify_enabled: boolean
      follow_up_enabled: boolean
      quiet_hours_enabled: boolean
    }
  }
}

export type OrdersResponse = {
  orders: OrderItem[]
}

export type DashboardStats = {
  date_range: DashboardStatsDateRange
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
