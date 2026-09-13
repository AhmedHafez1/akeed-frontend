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
  | { status: 'retryable_failure'; errorCode: string }
  | { status: 'permanent_failure'; errorCode: string }

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
