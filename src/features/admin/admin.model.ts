export type AdminHealthStatus = 'healthy' | 'attention_required' | 'critical'

export type AdminCreditBalanceState = 'none' | 'ok' | 'low' | 'zero' | 'debt'

export interface AdminUsage {
  used: number
  limit: number
  remaining: number
  percent: number
}

export type AdminStoreBilling =
  | {
      model: 'plan'
      plan: string | null
      subscription_status: string | null
      usage: AdminUsage
    }
  | {
      model: 'credits'
      account_status: string
      available: number
      held: number
      debt: number
      balance_state: AdminCreditBalanceState
    }

export interface AdminStore {
  integration_id: string
  org_id: string
  platform: string
  organization_name: string
  store_name: string
  shop_domain: string | null
  source_identity: string
  country_code: string | null
  timezone: string | null
  installed_at: string
  lifecycle_status: string
  onboarding_status: string
  plan: string | null
  subscription_status: string | null
  usage: AdminUsage
  billing: AdminStoreBilling
  auto_confirmation_enabled: boolean
  test_message_status: string
  first_eligible_real_order_at: string | null
  activated_at: string | null
  last_activity_at: string | null
  health: {
    status: AdminHealthStatus
    top_signal: string | null
    signal_count: number
    signals: string[]
  }
  data_quality: string[]
}

export interface AdminStoresResponse {
  summary: Record<string, number>
  data: AdminStore[]
  next_cursor: string | null
  evaluated_at: string
}

export interface AdminStoreMilestone {
  key: string
  at: string | null
  estimated: boolean
}

export interface AdminStoreDetail extends AdminStore {
  owner_email: string | null
  created_at: string | null
  last_synced_at: string | null
  billing_activated_at: string | null
  settings: {
    default_language: string
    shipping_currency: string
    follow_up_enabled: boolean
    follow_up_delay_minutes: number
    escalation_enabled: boolean
    quiet_hours_enabled: boolean
    quiet_hours_start: string | null
    quiet_hours_end: string | null
    send_delay_minutes: number
  }
  milestones: AdminStoreMilestone[]
  verification_totals: {
    total: number
    test: number
    by_status: Record<string, number>
    failed_24h: number
    total_24h: number
  }
}

export interface AdminStoreDetailResponse {
  store: AdminStoreDetail
  evaluated_at: string
}

export interface AdminStoreVerification {
  id: string
  status: string
  reason: string | null
  order_number: string | null
  external_order_id: string
  is_test: boolean
  customer_name: string | null
  customer_phone_masked: string
  total_price: string | null
  currency: string | null
  attempts: number
  follow_up_attempts: number
  template_name: string | null
  language_code: string | null
  cancellation_source: string | null
  created_at: string
  updated_at: string | null
  last_sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  confirmed_at: string | null
  canceled_at: string | null
  expired_at: string | null
  no_reply_at: string | null
  follow_up_sent_at: string | null
}

export interface AdminStoreVerificationsResponse {
  data: AdminStoreVerification[]
  next_cursor: string | null
  total_count: number
}

export interface FunnelStage {
  stage: string
  reached: number
  overall_rate: number
  step_rate: number
  average_time_from_previous_seconds: number | null
  time_sample_size: number
  capture: 'exact' | 'estimated' | 'mixed' | 'unavailable'
  coverage_percent: number
}

export interface AdminFunnelResponse {
  cohort: {
    installed_from: string | null
    installed_to: string | null
    installed_count: number
  }
  stages: FunnelStage[]
  active_after_7_days: {
    eligible_installations: number
    reached: number
    rate: number
  }
  uninstall: {
    count: number
    rate: number
    average_time_from_install_seconds: number | null
  }
  data_quality: {
    exact: number
    estimated: number
    unavailable: number
    notes: string[]
  }
  evaluated_at: string
}
