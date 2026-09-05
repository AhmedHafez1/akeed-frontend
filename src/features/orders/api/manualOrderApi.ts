import { api } from '@/shared/lib/auth'
import { ApiError } from '@/shared/lib/http'
import type { ManualOrderLifecycle } from '@/features/dashboard/model/dashboard.model'

export type ManualOrderCreateInput = {
  customerPhone: string
  customerName?: string
  orderNumber?: string
  totalPrice: string
  currency: string
  paymentMethod: string
}

export type ManualOrderCreateResponse = {
  orderId: string
  verificationId?: string
  status: 'accepted'
  duplicate: boolean
}

export type ManualOrderVerificationRetryResponse = {
  orderId: string
  verificationId?: string
  lifecycle: ManualOrderLifecycle
  duplicate: boolean
}

export const manualOrderErrorCodes = [
  'MANUAL_ORDER_VALIDATION_FAILED',
  'MANUAL_ORDER_IDEMPOTENCY_KEY_REQUIRED',
  'MANUAL_ORDER_IDEMPOTENCY_CONFLICT',
  'MANUAL_ORDER_ROLE_REQUIRED',
  'MANUAL_ORDER_SOURCE_UNAVAILABLE',
  'MANUAL_ORDER_SOURCE_AMBIGUOUS',
  'MANUAL_ORDER_SOURCE_UNSUPPORTED',
  'MANUAL_ORDER_SETUP_INCOMPLETE',
  'MANUAL_ORDER_ENTITLEMENT_REQUIRED',
  'MANUAL_ORDER_ACCEPTANCE_FAILED',
] as const

export type ManualOrderErrorCode = (typeof manualOrderErrorCodes)[number]

const manualOrderErrorCodeSet: ReadonlySet<string> = new Set(
  manualOrderErrorCodes
)

export type ManualOrderApiError = ApiError & {
  code?: ManualOrderErrorCode
  fieldErrors?: Record<string, string>
}

export function createManualOrder(
  input: ManualOrderCreateInput,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<ManualOrderCreateResponse> {
  return api.post<ManualOrderCreateResponse>('/api/orders', input, {
    headers: { 'Idempotency-Key': idempotencyKey },
    signal,
  })
}

export function retryManualOrderVerification(
  orderId: string,
  signal?: AbortSignal
): Promise<ManualOrderVerificationRetryResponse> {
  return api.post<ManualOrderVerificationRetryResponse>(
    `/api/orders/${encodeURIComponent(orderId)}/verification/retry`,
    undefined,
    { signal }
  )
}

export function isManualOrderApiError(
  error: unknown
): error is ManualOrderApiError {
  return (
    error instanceof ApiError &&
    (error.code === undefined || manualOrderErrorCodeSet.has(error.code))
  )
}
