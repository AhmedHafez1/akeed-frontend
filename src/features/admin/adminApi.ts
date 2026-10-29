import { fetchWithAuth } from '@/shared/lib/auth'
import type {
  AdminFunnelResponse,
  AdminStoreDetailResponse,
  AdminStoreLogoHeader,
  AdminStoreReviewPrompt,
  AdminStoresResponse,
  AdminStoreVerificationsResponse,
} from './admin.model'

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
    /** The backend's machine-readable refusal code, when it sent one. */
    readonly code: string | null = null,
    /** The rest of the refusal body: a reason, validation findings. */
    readonly details: Record<string, unknown> | null = null
  ) {
    super(message)
  }
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(path, {
    ...options,
    cache: 'no-store',
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    let message = 'The admin service is unavailable.'
    let code: string | null = null
    let details: Record<string, unknown> | null = null
    try {
      const body = (await response.json()) as {
        message?: string | string[]
        code?: unknown
      } & Record<string, unknown>
      details = body
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message || message
      code = typeof body.code === 'string' ? body.code : null
    } catch {
      // The status and request ID still provide a useful retryable error.
    }
    throw new AdminApiError(
      message,
      response.status,
      response.headers.get('x-request-id'),
      code,
      details
    )
  }
  return response.json() as Promise<T>
}

export function getAdminSession() {
  return adminRequest<{
    authenticated: true
    role: 'admin'
    /** Whether this staff member may write templates. */
    template_operations?: { enabled: boolean; operator: boolean }
  }>('/api/admin/session')
}

export function getAdminStores(query: string) {
  return adminRequest<AdminStoresResponse>(`/api/admin/stores?${query}`)
}

export function getAdminStore(integrationId: string) {
  return adminRequest<AdminStoreDetailResponse>(
    `/api/admin/stores/${encodeURIComponent(integrationId)}`
  )
}

/** Switches the store's logo header; audited by the backend. */
export function setAdminStoreLogoHeader(
  integrationId: string,
  enabled: boolean
) {
  return adminRequest<{ logo_header: AdminStoreLogoHeader }>(
    `/api/admin/stores/${encodeURIComponent(integrationId)}/logo-header`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }
  )
}

/**
 * Opens or withdraws the store's App Store review request; audited by the
 * backend, and refused once the merchant has opted out.
 */
export function setAdminStoreReviewPrompt(
  integrationId: string,
  enabled: boolean
) {
  return adminRequest<{ review_prompt: AdminStoreReviewPrompt }>(
    `/api/admin/stores/${encodeURIComponent(integrationId)}/review-prompt`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }
  )
}

/**
 * Puts the store back to eligible, so the merchant is asked again while the
 * switch is on. Audited by the backend.
 */
export function resetAdminStoreReviewPrompt(integrationId: string) {
  return adminRequest<{ review_prompt: AdminStoreReviewPrompt }>(
    `/api/admin/stores/${encodeURIComponent(integrationId)}/review-prompt/reset`,
    { method: 'POST' }
  )
}

export function getAdminStoreVerifications(
  integrationId: string,
  query: string
) {
  return adminRequest<AdminStoreVerificationsResponse>(
    `/api/admin/stores/${encodeURIComponent(integrationId)}/verifications?${query}`
  )
}

export function getAdminFunnel(query: string) {
  return adminRequest<AdminFunnelResponse>(`/api/admin/funnel?${query}`)
}
