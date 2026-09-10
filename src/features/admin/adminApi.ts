import { fetchWithAuth } from '@/shared/lib/auth'
import type { AdminFunnelResponse, AdminStoresResponse } from './admin.model'

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
    /** The backend's machine-readable refusal code, when it sent one. */
    readonly code: string | null = null
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
    try {
      const body = (await response.json()) as {
        message?: string | string[]
        code?: unknown
      }
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
      code
    )
  }
  return response.json() as Promise<T>
}

export function getAdminSession() {
  return adminRequest<{ authenticated: true; role: 'admin' }>(
    '/api/admin/session'
  )
}

export function getAdminStores(query: string) {
  return adminRequest<AdminStoresResponse>(`/api/admin/stores?${query}`)
}

export function getAdminFunnel(query: string) {
  return adminRequest<AdminFunnelResponse>(`/api/admin/funnel?${query}`)
}
