import { fetchWithAuth } from '@/shared/lib/auth'
import type { AdminFunnelResponse, AdminStoresResponse } from './admin.model'

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null
  ) {
    super(message)
  }
}

async function adminGet<T>(path: string): Promise<T> {
  const response = await fetchWithAuth(path, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    let message = 'The admin service is unavailable.'
    try {
      const body = (await response.json()) as { message?: string | string[] }
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message || message
    } catch {
      // The status and request ID still provide a useful retryable error.
    }
    throw new AdminApiError(
      message,
      response.status,
      response.headers.get('x-request-id')
    )
  }
  return response.json() as Promise<T>
}

export function getAdminSession() {
  return adminGet<{ authenticated: true; role: 'admin' }>('/api/admin/session')
}

export function getAdminStores(query: string) {
  return adminGet<AdminStoresResponse>(`/api/admin/stores?${query}`)
}

export function getAdminFunnel(query: string) {
  return adminGet<AdminFunnelResponse>(`/api/admin/funnel?${query}`)
}
