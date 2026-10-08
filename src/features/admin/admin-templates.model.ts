export type TemplateReviewStatus =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'paused'
  | 'disabled'
  | 'in_appeal'
  | 'limit_exceeded'
  | 'pending_deletion'
  | 'deleted'
  | 'archived'
  | 'flagged'
  | 'locked'
  | 'reinstated'
  | 'unarchived'
  | 'missing'
  | 'unknown'

export type TemplateCategory =
  | 'utility'
  | 'marketing'
  | 'authentication'
  | 'unknown'

export type TemplateQuality = 'high' | 'medium' | 'low' | 'pending' | 'unknown'

export type TemplateLanguage = 'ar' | 'en'

export type TemplateDriftState =
  | 'not_synced'
  | 'missing'
  | 'unreadable'
  | 'drift'
  | 'in_sync'

export type TemplateDriftKind =
  | 'parameter_format'
  | 'variables'
  | 'buttons'
  | 'button_labels'
  | 'body'

export type TemplateDriftSeverity = 'send' | 'preview'

export interface TemplateDriftSummary {
  state: TemplateDriftState
  kinds: TemplateDriftKind[]
  severity: TemplateDriftSeverity | null
}

export interface TemplateDriftDifference {
  kind: TemplateDriftKind
  severity: TemplateDriftSeverity
  registered: string
  provider: string
}

/** Rates are shares of accepted sends, 0 to 1, and null without any send. */
export interface TemplateMetrics {
  sends: number
  delivered: number
  read: number
  replies: number
  confirmed: number
  canceled: number
  no_reply: number
  reply_rate: number | null
  confirmation_rate: number | null
}

export interface TemplateSummary {
  key: string
  purpose: string
  language: TemplateLanguage
  style: string
  template_name: string
  language_code: string
  parameter_format: 'named' | 'positional'
  review_status: TemplateReviewStatus | null
  category: TemplateCategory | null
  pending_category: TemplateCategory | null
  quality: TemplateQuality | null
  is_active: boolean
  is_default: boolean
  sendable: boolean
  last_synced_at: string | null
  active_store_count: number
  drift: TemplateDriftSummary
  metrics: TemplateMetrics
}

export interface TemplateSyncRun {
  id: string
  trigger: string
  status: string
  started_at: string
  finished_at: string | null
  error_code: string | null
  provider_template_count: number | null
  updated_count: number | null
  unchanged_count: number | null
  missing_keys: string[]
  unknown_at_provider: { template_name: string; language_code: string }[]
}

export interface TemplateContext {
  range: { from: string; to: string; timezone: 'UTC' }
  sync: {
    enabled: boolean
    guardrail_enabled: boolean
    last_run: TemplateSyncRun | null
  }
  operations: {
    enabled: boolean
    operator: boolean
    test_send_available: boolean
  }
  evaluated_at: string
}

export interface TemplateListResponse extends TemplateContext {
  templates: TemplateSummary[]
}

/** A message ready to show: the backend has already filled the values. */
export interface RenderedTemplateMessage {
  paragraphs: string[]
  buttons: { label: string; kind: string }[]
  direction: 'rtl' | 'ltr'
}

export interface TemplateDetailResponse extends TemplateContext {
  template: TemplateSummary & {
    provider_template_id: string | null
    text_changed_at: string | null
  }
  message: RenderedTemplateMessage | null
  registered_preview: RenderedTemplateMessage
  variables: { variable: string; parameter: string; sample: string }[]
  drift: TemplateDriftSummary & { differences: TemplateDriftDifference[] }
  history: {
    events: {
      id: string
      field: string
      value: Record<string, string | null>
      outcome: string
      occurred_at: string
      received_at: string
    }[]
    sync_runs: {
      id: string
      trigger: string
      status: string
      started_at: string
      finished_at: string | null
      error_code: string | null
      missing: boolean
    }[]
  }
  stores: {
    total: number
    shown: {
      integration_id: string
      store_name: string | null
      platform: string
      domain: string | null
      default_language: string
    }[]
  }
  metrics_by_purpose: (TemplateMetrics & { purpose: string })[]
}

export interface TemplateRange {
  from: string
  to: string
}

export const TEMPLATE_DEFAULT_RANGE_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The last 30 UTC days, today included, as the API's calendar dates. */
export function defaultTemplateRange(now: Date = new Date()): TemplateRange {
  const day = (time: number) => new Date(time).toISOString().slice(0, 10)
  return {
    from: day(now.getTime() - (TEMPLATE_DEFAULT_RANGE_DAYS - 1) * DAY_MS),
    to: day(now.getTime()),
  }
}

/** Whether both ends are dates in order; the server checks the length. */
export function isTemplateRangeValid(range: TemplateRange): boolean {
  return (
    CALENDAR_DATE.test(range.from) &&
    CALENDAR_DATE.test(range.to) &&
    range.from <= range.to
  )
}

export function templateRangeQuery(range: TemplateRange): string {
  return new URLSearchParams({ from: range.from, to: range.to }).toString()
}

/** `not_synced` stands for a template this environment has never read. */
export type TemplateStatusFilter = TemplateReviewStatus | 'not_synced' | ''

export interface TemplateFilters {
  purpose: string
  language: TemplateLanguage | ''
  status: TemplateStatusFilter
  active: 'active' | 'inactive' | ''
}

export const emptyTemplateFilters: TemplateFilters = {
  purpose: '',
  language: '',
  status: '',
  active: '',
}

export function templateStatusKey(
  status: TemplateReviewStatus | null
): TemplateReviewStatus | 'not_synced' {
  return status ?? 'not_synced'
}

export function filterTemplates(
  templates: readonly TemplateSummary[],
  filters: TemplateFilters
): TemplateSummary[] {
  return templates.filter(
    (template) =>
      (!filters.purpose || template.purpose === filters.purpose) &&
      (!filters.language || template.language === filters.language) &&
      (!filters.status ||
        templateStatusKey(template.review_status) === filters.status) &&
      (!filters.active || template.is_active === (filters.active === 'active'))
  )
}

/** The distinct values a filter offers, in the order they first appear. */
export function templateFilterValues<T extends string>(
  templates: readonly TemplateSummary[],
  pick: (template: TemplateSummary) => T
): T[] {
  return [...new Set(templates.map(pick))]
}

export type TemplateTone = 'success' | 'warning' | 'danger' | 'info' | 'outline'

const WAITING_STATUSES: readonly TemplateReviewStatus[] = [
  'pending',
  'in_appeal',
  'reinstated',
  'unarchived',
]

/** Approved is good, a review in progress is a warning, the rest block sends. */
export function reviewStatusTone(
  status: TemplateReviewStatus | null
): TemplateTone {
  if (status === null) return 'outline'
  if (status === 'approved') return 'success'
  return WAITING_STATUSES.includes(status) ? 'warning' : 'danger'
}

export function qualityTone(quality: TemplateQuality | null): TemplateTone {
  if (quality === 'high') return 'success'
  if (quality === 'medium') return 'warning'
  if (quality === 'low') return 'danger'
  return 'outline'
}

export function driftTone(drift: TemplateDriftSummary): TemplateTone {
  if (drift.state === 'in_sync') return 'success'
  if (drift.state === 'not_synced') return 'outline'
  if (drift.state === 'missing' || drift.severity === 'send') return 'danger'
  return 'warning'
}
