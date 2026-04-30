export type VerificationStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'confirmed'
  | 'canceled'
  | 'expired'
  | 'failed'

export type VerificationStatusFilter =
  | 'all'
  | 'awaiting_response'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'confirmed'
  | 'canceled'

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
}

export type OrdersResponse = {
  orders: OrderItem[]
}

export type DashboardStats = {
  date_range: DashboardStatsDateRange
  totals: {
    confirmed: number
    canceled: number
    sent: number
    delivered: number
    read: number
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
