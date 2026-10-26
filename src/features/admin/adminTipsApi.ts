import { adminRequest } from './adminApi'
import type {
  AdminTipCampaign,
  AdminTipListResponse,
  AdminTipOptions,
  AdminTipOrganizationsResponse,
  AdminTipReview,
  TipStatus,
} from './admin-tips.model'

const BASE = '/api/admin/tips-campaigns'

function send<T>(url: string, method: string, body?: unknown) {
  return adminRequest<T>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export function getTipCampaigns(params: {
  status?: TipStatus
  search?: string
  cursor?: string
}) {
  return adminRequest<AdminTipListResponse>(`${BASE}${query(params)}`)
}

export function getTipCampaign(id: string) {
  return adminRequest<AdminTipCampaign>(`${BASE}/${encodeURIComponent(id)}`)
}

export function getTipOptions() {
  return adminRequest<AdminTipOptions>(`${BASE}/audience-options`)
}

export function searchTipOrganizations(params: {
  search?: string
  cursor?: string
}) {
  return adminRequest<AdminTipOrganizationsResponse>(
    `${BASE}/audience/organizations${query(params)}`
  )
}

export function getTipRecipients(
  id: string,
  params: { search?: string; cursor?: string }
) {
  return adminRequest<AdminTipOrganizationsResponse>(
    `${BASE}/${encodeURIComponent(id)}/recipients${query(params)}`
  )
}

export function createTipCampaign(body: unknown) {
  return send<AdminTipCampaign>(BASE, 'POST', body)
}

export function updateTipCampaign(id: string, body: unknown) {
  return send<AdminTipCampaign>(
    `${BASE}/${encodeURIComponent(id)}`,
    'PATCH',
    body
  )
}

export function reviewTipCampaign(id: string) {
  return send<AdminTipReview>(
    `${BASE}/${encodeURIComponent(id)}/review`,
    'POST'
  )
}

export function publishTipCampaign(id: string, reviewToken: string) {
  return send<AdminTipCampaign & { already_published: boolean }>(
    `${BASE}/${encodeURIComponent(id)}/publish`,
    'POST',
    { review_token: reviewToken }
  )
}

export function changeTipLifecycle(
  id: string,
  action: 'pause' | 'resume' | 'archive'
) {
  return send<AdminTipCampaign>(
    `${BASE}/${encodeURIComponent(id)}/${action}`,
    'POST'
  )
}
