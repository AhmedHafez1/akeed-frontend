import { adminRequest } from './adminApi'
import type {
  AdjustmentPreview,
  AdjustmentResult,
  DispatchResolutionChoice,
  DispatchResolutionResult,
  InquiryResult,
  ProviderAction,
  ProviderActionResult,
  RepairPreview,
  RepairResult,
} from './standalone-billing-operations.model'
import { standaloneBillingPath } from './useStandaloneBillingAccount'

/**
 * Staff billing writes. Each carries only what the backend asks for: which
 * preview, a reason, evidence and the organization. Balances, quantities to
 * apply and payment outcomes are never sent from here.
 */
function post<T>(path: string, body: unknown, headers?: HeadersInit) {
  return adminRequest<T>(`${standaloneBillingPath}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  })
}

const account = (orgId: string) => `/accounts/${encodeURIComponent(orgId)}`

export function previewAdjustment(orgId: string, quantity: number) {
  return post<AdjustmentPreview>(`${account(orgId)}/adjustments/preview`, {
    quantity,
  })
}

export function applyAdjustment(
  orgId: string,
  preview: Pick<AdjustmentPreview, 'previewId' | 'fingerprint'>,
  reason: string,
  idempotencyKey: string
) {
  return post<AdjustmentResult>(
    `${account(orgId)}/adjustments/apply`,
    { previewId: preview.previewId, fingerprint: preview.fingerprint, reason },
    { 'Idempotency-Key': idempotencyKey }
  )
}

export function previewRepair(orgId: string) {
  return post<RepairPreview>(`${account(orgId)}/projection-repair/preview`, {})
}

export function applyRepair(
  orgId: string,
  preview: { previewId: string; fingerprint: string },
  reason: string
) {
  return post<RepairResult>(`${account(orgId)}/projection-repair/apply`, {
    previewId: preview.previewId,
    fingerprint: preview.fingerprint,
    reason,
  })
}

export function resolveDispatch(
  orgId: string,
  dispatchId: string,
  input: {
    resolution: DispatchResolutionChoice
    providerMessageId?: string
    evidence?: string
    reason: string
  }
) {
  return post<DispatchResolutionResult>(
    `/dispatches/${encodeURIComponent(dispatchId)}/resolve`,
    {
      orgId,
      resolution: input.resolution,
      ...(input.resolution === 'accepted'
        ? { providerMessageId: input.providerMessageId }
        : {}),
      ...(input.evidence ? { evidence: input.evidence } : {}),
      reason: input.reason,
    }
  )
}

export function reconcilePurchase(
  orgId: string,
  reference: string,
  reason: string
) {
  return post<InquiryResult>(
    `/purchases/${encodeURIComponent(reference)}/reconcile`,
    { orgId, reason }
  )
}

export function recordProviderAction(
  orgId: string,
  reference: string,
  input: {
    action: ProviderAction
    providerReference?: string
    amountMinor: number
    currency: string
    evidence: string
    reason: string
  }
) {
  return post<ProviderActionResult>(
    `/purchases/${encodeURIComponent(reference)}/provider-action`,
    {
      orgId,
      action: input.action,
      ...(input.providerReference
        ? { providerReference: input.providerReference }
        : {}),
      amountMinor: input.amountMinor,
      currency: input.currency,
      evidence: input.evidence,
      reason: input.reason,
    }
  )
}
