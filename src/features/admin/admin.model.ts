export type AdminHealthStatus = 'healthy' | 'attention_required' | 'critical'

export interface AdminStore {
  integration_id: string
  store_name: string
  shop_domain: string
  country_code: string | null
  timezone: string | null
  installed_at: string
  lifecycle_status: string
  onboarding_status: string
  plan: string | null
  subscription_status: string | null
  usage: {
    used: number
    limit: number
    remaining: number
    percent: number
  }
  auto_confirmation_enabled: boolean
  test_message_status: string
  first_eligible_real_order_at: string | null
  activated_at: string | null
  last_activity_at: string | null
  health: {
    status: AdminHealthStatus
    top_signal: string | null
    signal_count: number
  }
  data_quality: string[]
}

export interface AdminStoresResponse {
  summary: Record<string, number>
  data: AdminStore[]
  next_cursor: string | null
  evaluated_at: string
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
