export type VerificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'confirmed'
  | 'canceled'
  | 'expired'
  | 'failed'

export type VerificationStatusFilter =
  | 'all'
  | 'pending'
  | 'sent'
  | 'confirmed'
  | 'canceled'

export type DashboardStatsDateRange = 'today' | 'last_7_days' | 'last_30_days'

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
  verifications: VerificationItem[]
}

export type OrdersResponse = {
  orders: OrderItem[]
}

export type VerificationStatsTrend = {
  current_month: number
  previous_month: number
  change: number
  change_percentage: number | null
}

export type DashboardStats = {
  date_range: DashboardStatsDateRange
  totals: {
    total: number
    pending: number
    confirmed: number
    canceled: number
    expired: number
    verification_rate: number
  }
  monthly_trends: {
    total: VerificationStatsTrend
    pending: VerificationStatsTrend
    confirmed: VerificationStatsTrend
    canceled: VerificationStatsTrend
    expired: VerificationStatsTrend
  }
  usage: {
    used: number
    limit: number
  }
}

export type DashboardStatsResponse = {
  stats: DashboardStats
}
