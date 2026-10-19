import { ApiError } from '@/shared/lib/http'

/** An App Store review request staff opened for this store. */
export interface ReviewPrompt {
  id: string
}

export interface ReviewPromptEnvelope {
  prompt: ReviewPrompt | null
}

/** The merchant's answer; each one closes the request. */
export type ReviewPromptAction =
  | 'review_clicked'
  | 'snoozed'
  | 'dismissed'
  | 'dont_ask_again'

export interface ReviewPromptActionResponse {
  outcome: 'recorded' | 'replayed'
}

/**
 * The request was answered elsewhere, withdrawn by staff or never existed.
 * Either way there is nothing left to ask, so the banner goes away.
 */
export function isReviewPromptClosed(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === 'REVIEW_PROMPT_NOT_PENDING' || error.status === 404)
  )
}
