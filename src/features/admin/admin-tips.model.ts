import { SUPPORTED_LOCALES } from '@/shared/lib/locale'

/** `update` is a new feature; `change` says Akeed changed how something works. */
export type TipType = 'tip' | 'update' | 'change' | 'note'
export type TipStatus = 'draft' | 'published' | 'paused' | 'archived'
export type TipEffectiveStatus = TipStatus | 'expired'
export type TipTargetingMode = 'direct' | 'filters'
export type TipActionKind = 'none' | 'internal' | 'external'

export interface TipAudienceFilters {
  countries?: string[]
  platforms?: string[]
  signup_from?: string
  signup_to?: string
  message_languages?: string[]
  plans?: string[]
  features?: Record<string, boolean>
}

export interface TipTranslation {
  locale: string
  title: string
  description: string
  action_label: string | null
}

export type TipAction =
  | { kind: 'internal'; route: string }
  | { kind: 'external'; url: string }

export interface TipAnalytics {
  recipients: number
  viewed: number
  clicked: number
  dismissed: number
}

export interface AdminTipCampaign {
  id: string
  name: string
  type: TipType
  status: TipStatus
  effective_status: TipEffectiveStatus
  action: TipAction | null
  expires_at: string | null
  audience: {
    mode: TipTargetingMode
    filters: TipAudienceFilters
    selected_org_ids: string[]
    excluded_org_ids: string[]
  }
  translations: TipTranslation[]
  revision: number
  review: {
    revision: number
    recipient_count: number
    reviewed_at: string | null
    current: boolean
  } | null
  published_at: string | null
  recipient_count: number | null
  paused_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  analytics: TipAnalytics
}

export interface AdminTipListItem {
  id: string
  name: string
  type: TipType
  status: TipStatus
  effective_status: TipEffectiveStatus
  has_action: boolean
  published_at: string | null
  expires_at: string | null
  created_at: string
  recipient_count: number | null
  analytics: TipAnalytics
}

export interface AdminTipListResponse {
  items: AdminTipListItem[]
  next_cursor: string | null
}

export interface AdminTipOptions {
  locales: string[]
  platforms: string[]
  plans: string[]
  message_languages: string[]
  features: string[]
  action_routes: { key: string; modes: ('embedded' | 'standalone')[] }[]
  countries: { country_code: string; count: number }[]
  limits: {
    name: number
    title: number
    titleLineBreaks: number
    description: number
    descriptionLineBreaks: number
    actionLabel: number
    url: number
    orgList: number
    maxRecipients: number
  }
}

export interface AdminTipOrganization {
  org_id: string
  organization_name: string | null
  store_name: string | null
  shop_domain: string | null
  platform: string | null
  country_code: string | null
  excluded: boolean
  first_viewed_at: string | null
  first_clicked_at: string | null
  dismissed_at: string | null
}

export interface AdminTipOrganizationsResponse {
  items: AdminTipOrganization[]
  next_cursor: string | null
}

export interface AdminTipReview {
  review_token: string
  recipient_count: number
  campaign: AdminTipCampaign
}

/** English first: it is required and every other language falls back to it. */
export const TIP_LOCALES: readonly string[] = [
  'en',
  ...SUPPORTED_LOCALES.filter((locale) => locale !== 'en'),
]

export const TIP_FALLBACK_LOCALE = 'en'

/** Mirrors the backend policy so mistakes show before saving. */
export const TIP_LIMITS = {
  name: 120,
  title: 80,
  titleLineBreaks: 1,
  description: 500,
  descriptionLineBreaks: 8,
  actionLabel: 30,
  url: 2048,
  orgList: 500,
}

export interface TipContentForm {
  title: string
  description: string
  actionLabel: string
}

export interface TipForm {
  name: string
  type: TipType
  /** Languages with content, English always first. */
  locales: string[]
  content: Record<string, TipContentForm>
  actionKind: TipActionKind
  actionRoute: string
  actionUrl: string
  /** `datetime-local` value in the admin's own time zone, or empty. */
  expiresLocal: string
  mode: TipTargetingMode
  filters: TipAudienceFilters
  selectedOrgIds: string[]
  excludedOrgIds: string[]
}

const emptyContent = (): TipContentForm => ({
  title: '',
  description: '',
  actionLabel: '',
})

export function emptyTipForm(): TipForm {
  return {
    name: '',
    type: 'tip',
    locales: [TIP_FALLBACK_LOCALE],
    content: { [TIP_FALLBACK_LOCALE]: emptyContent() },
    actionKind: 'none',
    actionRoute: '',
    actionUrl: '',
    expiresLocal: '',
    mode: 'filters',
    filters: {},
    selectedOrgIds: [],
    excludedOrgIds: [],
  }
}

export function tipFormFromCampaign(campaign: AdminTipCampaign): TipForm {
  const content: Record<string, TipContentForm> = {}
  for (const row of campaign.translations) {
    content[row.locale] = {
      title: row.title,
      description: row.description,
      actionLabel: row.action_label ?? '',
    }
  }
  if (!content[TIP_FALLBACK_LOCALE])
    content[TIP_FALLBACK_LOCALE] = emptyContent()
  return {
    name: campaign.name,
    type: campaign.type,
    locales: TIP_LOCALES.filter((locale) => content[locale]),
    content,
    actionKind: campaign.action?.kind ?? 'none',
    actionRoute:
      campaign.action?.kind === 'internal' ? campaign.action.route : '',
    actionUrl: campaign.action?.kind === 'external' ? campaign.action.url : '',
    expiresLocal: campaign.expires_at
      ? isoToLocalInput(campaign.expires_at)
      : '',
    mode: campaign.audience.mode,
    filters: campaign.audience.filters,
    selectedOrgIds: campaign.audience.selected_org_ids,
    excludedOrgIds: campaign.audience.excluded_org_ids,
  }
}

export function addTipLocale(form: TipForm, locale: string): TipForm {
  if (form.locales.includes(locale)) return form
  return {
    ...form,
    locales: TIP_LOCALES.filter(
      (candidate) => candidate === locale || form.locales.includes(candidate)
    ),
    content: { ...form.content, [locale]: emptyContent() },
  }
}

export function removeTipLocale(form: TipForm, locale: string): TipForm {
  if (locale === TIP_FALLBACK_LOCALE) return form
  const content = { ...form.content }
  delete content[locale]
  return {
    ...form,
    locales: form.locales.filter((candidate) => candidate !== locale),
    content,
  }
}

function tipAction(form: TipForm): TipAction | null {
  if (form.actionKind === 'internal')
    return { kind: 'internal', route: form.actionRoute }
  if (form.actionKind === 'external')
    return { kind: 'external', url: form.actionUrl.trim() }
  return null
}

/** The fields a published campaign may still change. */
export function tipContentPayload(form: TipForm) {
  const hasAction = form.actionKind !== 'none'
  return {
    name: form.name,
    type: form.type,
    action: tipAction(form),
    translations: form.locales.map((locale) => ({
      locale,
      title: form.content[locale]?.title ?? '',
      description: form.content[locale]?.description ?? '',
      action_label: hasAction
        ? (form.content[locale]?.actionLabel ?? '')
        : null,
    })),
  }
}

export function tipDraftPayload(form: TipForm) {
  return {
    ...tipContentPayload(form),
    expires_at: form.expiresLocal ? localInputToIso(form.expiresLocal) : null,
    audience: {
      mode: form.mode,
      filters: form.filters,
      selected_org_ids: form.selectedOrgIds,
      excluded_org_ids: form.excludedOrgIds,
    },
  }
}

/** Field key → issue code, e.g. `title.ar` → `required`. */
export type TipFormIssues = Record<string, string>

export function tipIssueKey(field: string, locale?: string): string {
  return locale ? `${field}.${locale}` : field
}

function lineBreaks(text: string): number {
  return text.replace(/\r\n?/g, '\n').trim().split('\n').length - 1
}

function textIssue(
  text: string,
  max: number,
  maxLineBreaks: number
): string | null {
  const value = text.trim()
  if (!value) return 'required'
  if ([...value].length > max) return 'too_long'
  if (lineBreaks(value) > maxLineBreaks) return 'too_many_lines'
  return null
}

/** Only absolute HTTPS links to a public host, as the backend requires. */
export function externalUrlIssue(raw: string): string | null {
  const url = raw.trim()
  if (!url) return 'required'
  if (url.length > TIP_LIMITS.url) return 'url_too_long'
  if (!url.toLowerCase().startsWith('https://')) return 'url_not_https'
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (
      parsed.username ||
      parsed.password ||
      !host.includes('.') ||
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      /\s/.test(url)
    )
      return 'invalid_url'
  } catch {
    return 'invalid_url'
  }
  return null
}

export function validateTipForm(
  form: TipForm,
  options: { now?: Date; checkExpiry?: boolean } = {}
): TipFormIssues {
  const issues: TipFormIssues = {}
  const set = (key: string, code: string | null) => {
    if (code) issues[key] = code
  }
  set('name', textIssue(form.name, TIP_LIMITS.name, 0))
  const hasAction = form.actionKind !== 'none'
  for (const locale of form.locales) {
    const content = form.content[locale] ?? emptyContent()
    set(
      tipIssueKey('title', locale),
      textIssue(content.title, TIP_LIMITS.title, TIP_LIMITS.titleLineBreaks)
    )
    set(
      tipIssueKey('description', locale),
      textIssue(
        content.description,
        TIP_LIMITS.description,
        TIP_LIMITS.descriptionLineBreaks
      )
    )
    if (hasAction)
      set(
        tipIssueKey('action_label', locale),
        textIssue(content.actionLabel, TIP_LIMITS.actionLabel, 0)
      )
  }
  if (form.actionKind === 'internal' && !form.actionRoute)
    issues['action.route'] = 'invalid_route'
  if (form.actionKind === 'external')
    set('action.url', externalUrlIssue(form.actionUrl))
  if (options.checkExpiry !== false && form.expiresLocal) {
    const at = Date.parse(localInputToIso(form.expiresLocal))
    if (!Number.isFinite(at)) issues.expires_at = 'invalid_value'
    else if (at <= (options.now ?? new Date()).getTime())
      issues.expires_at = 'expiry_in_past'
  }
  if (form.filters.signup_from && form.filters.signup_to) {
    if (form.filters.signup_from > form.filters.signup_to)
      issues['filters.signup_to'] = 'date_order'
  }
  if (form.selectedOrgIds.length > TIP_LIMITS.orgList)
    issues.selected_org_ids = 'too_many'
  if (form.excludedOrgIds.length > TIP_LIMITS.orgList)
    issues.excluded_org_ids = 'too_many'
  return issues
}

/** The backend's coded findings, keyed the same way as the form's own. */
export function tipIssuesFromApi(details: unknown): TipFormIssues {
  const issues: TipFormIssues = {}
  const list = (details as { issues?: unknown } | null)?.issues
  if (!Array.isArray(list)) return issues
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const { field, code, locale } = item as Record<string, unknown>
    if (typeof field === 'string' && typeof code === 'string')
      issues[
        tipIssueKey(field, typeof locale === 'string' ? locale : undefined)
      ] = code
  }
  return issues
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `datetime-local` text, read in the browser's zone, as a UTC instant. */
export function localInputToIso(value: string): string {
  const at = new Date(value)
  return Number.isNaN(at.getTime()) ? '' : at.toISOString()
}

export function isoToLocalInput(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`
}

export function organizationLabel(row: AdminTipOrganization): string {
  return (
    row.store_name || row.organization_name || row.shop_domain || row.org_id
  )
}

/** Which audience filters are in use, for the review summary. */
export function activeFilterCount(filters: TipAudienceFilters): number {
  return [
    filters.countries?.length,
    filters.platforms?.length,
    filters.signup_from || filters.signup_to,
    filters.message_languages?.length,
    filters.plans?.length,
    Object.keys(filters.features ?? {}).length,
  ].filter(Boolean).length
}
