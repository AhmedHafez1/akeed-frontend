import { fetchWithAuth } from '@/shared/lib/auth'
import { parseJsonResponse } from '@/shared/lib/http'
import type {
  CreatePurchaseResponse,
  CreditSummary,
  LedgerEntry,
  PagedResponse,
  PurchaseDetail,
  PurchaseSummary,
} from '../domain/billing.types'

interface BillingErrorBody {
  code?: unknown
  fieldErrors?: unknown
  message?: unknown
  reference?: unknown
}

export class BillingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly reference?: string,
    readonly fieldErrors?: Record<string, string>
  ) {
    super(message)
    this.name = 'BillingApiError'
  }
}

async function billingRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  const response = await fetchWithAuth(path, {
    ...options,
    cache: 'no-store',
    headers,
  })
  if (response.ok) return parseJsonResponse<T>(response)

  let body: BillingErrorBody = {}
  try {
    body = (await response.json()) as BillingErrorBody
  } catch {
    // The HTTP status still gives the caller a safe retry path.
  }
  const message = Array.isArray(body.message)
    ? body.message.filter((value) => typeof value === 'string').join(', ')
    : typeof body.message === 'string'
      ? body.message
      : `Billing request failed with status ${response.status}`
  const fieldErrors =
    body.fieldErrors &&
    typeof body.fieldErrors === 'object' &&
    !Array.isArray(body.fieldErrors)
      ? Object.fromEntries(
          Object.entries(body.fieldErrors).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        )
      : undefined
  throw new BillingApiError(
    message,
    response.status,
    typeof body.code === 'string' ? body.code : undefined,
    typeof body.reference === 'string' ? body.reference : undefined,
    fieldErrors
  )
}

export function fetchCreditSummary(signal?: AbortSignal) {
  return billingRequest<CreditSummary>('/api/billing/credits', { signal })
}

export function fetchLedger(cursor?: string, signal?: AbortSignal, limit = 25) {
  const query = new URLSearchParams({ limit: String(limit) })
  if (cursor) query.set('cursor', cursor)
  return billingRequest<PagedResponse<LedgerEntry>>(
    `/api/billing/credits/ledger?${query}`,
    { signal }
  )
}

export function fetchPurchases(
  cursor?: string,
  signal?: AbortSignal,
  limit = 25
) {
  const query = new URLSearchParams({ limit: String(limit) })
  if (cursor) query.set('cursor', cursor)
  return billingRequest<PagedResponse<PurchaseSummary>>(
    `/api/billing/purchases?${query}`,
    { signal }
  )
}

export function fetchPurchase(reference: string) {
  return billingRequest<PurchaseDetail>(
    `/api/billing/purchases/${encodeURIComponent(reference)}`
  )
}

export function createPurchase(quantity: number, idempotencyKey: string) {
  return billingRequest<CreatePurchaseResponse>('/api/billing/purchases', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ quantity }),
  })
}
