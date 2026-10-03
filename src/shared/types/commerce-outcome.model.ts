export type CommerceOutcomeAction =
  | 'customer_confirmation'
  | 'customer_cancellation'
  | 'merchant_no_reply_cancellation'
  | 'merchant_cancellation_tagging'
  | 'automatic_no_reply_tagging'

export type CommerceOutcomeCapability = {
  action: CommerceOutcomeAction
  supported: boolean
}

export type CommerceOutcomeOperationResult =
  | { status: 'applied' }
  | { status: 'accepted_without_reference' }
  | {
      status: 'unsupported'
      reason: 'adapter_not_registered' | 'capability_not_supported'
    }
  | {
      status: 'pending_provider_operation'
      providerOperationId: string
    }
  | { status: 'retryable_failure'; errorCode: string; retryAfterMs?: number }
  | {
      status: 'permanent_failure'
      errorCode: string
      requiresAssistance?: boolean
    }

export type CommerceOutcomeSyncState =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'unsupported'

/**
 * Whether the store has a verification's result yet. Separate from the
 * verification status, which is always the local result. Sources that do not
 * report it send `null`.
 */
export interface RemoteSync {
  state: CommerceOutcomeSyncState
  action: CommerceOutcomeAction
  /** A stable code; the dashboard maps it to a sentence. */
  error_code: string | null
  /** Only the merchant can clear it (a rejected key, say). */
  requires_assistance: boolean
  retryable: boolean
  updated_at: string
}

export interface OutcomeSyncRetryResponse {
  success: true
  verificationId: string
  remote_sync: RemoteSync | null
}

export type CommerceOutcomeDispatchResult = CommerceOutcomeOperationResult & {
  orgId: string
  integrationId: string
  externalOrderId: string
  action: CommerceOutcomeAction
  correlationId: string
}

export interface CancelOrderResponse {
  success: true
  verificationId: string
  status: 'canceled'
  alreadyCanceled?: boolean
  providerOperationId?: string
  operation?: CommerceOutcomeOperationResult
}
