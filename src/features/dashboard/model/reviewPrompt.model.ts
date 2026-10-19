import type { ShopifyReviewCode } from '@/shared/lib/shopifyReviews'

/**
 * Which card the merchant sees: their own results once enough orders were
 * confirmed, otherwise a plain request.
 */
export type ReviewPromptVariant = 'results' | 'fallback'

/** The review request for this store, as `GET /api/review-prompt` answers. */
export interface ReviewPromptView {
  visible: boolean
  variant: ReviewPromptVariant
  /** Customer-confirmed orders since install; null when not counted. */
  confirmed: number | null
  /** Customer-canceled orders since install; null when not counted. */
  canceled: number | null
  /** When the current installation started, as an ISO timestamp. */
  since: string | null
}

/** The App Bridge Reviews API answer, or `unavailable` when it was missing or threw. */
export type ReviewRequestCode = ShopifyReviewCode

export type ReviewPromptAction = 'shown' | 'clicked' | 'result' | 'not_now'

export interface ReviewPromptActionRequest {
  action: ReviewPromptAction
  /** Required when the action is `result`. */
  code?: ReviewRequestCode
}

export interface ReviewPromptActionResponse {
  outcome: 'recorded' | 'replayed'
}

/** The fewest confirmed orders that earn the results variant. */
export const REVIEW_RESULTS_THRESHOLD = 10

/** What the card does after Shopify answers a review request. */
export interface ReviewOutcome {
  /** Thank the merchant, keep the card, hide it, or change nothing. */
  ui: 'thanks' | 'keep' | 'hide' | 'ignore'
  /** Open the listing's review page in a new tab. */
  openFallback: boolean
}

/**
 * Maps a Reviews API code to what the merchant sees next. Any code that
 * leaves nothing on screen opens the listing instead, so the button always
 * does something.
 */
export function reviewOutcomeFor(code: ReviewRequestCode): ReviewOutcome {
  switch (code) {
    case 'success':
    case 'already-reviewed':
      return { ui: 'thanks', openFallback: false }
    case 'cooldown-period':
    case 'annual-limit-reached':
    case 'mobile-app':
    case 'recently-installed':
    case 'unavailable':
      return { ui: 'thanks', openFallback: true }
    case 'cancelled':
      return { ui: 'keep', openFallback: false }
    case 'merchant-ineligible':
      return { ui: 'hide', openFallback: false }
    case 'already-open':
    case 'open-in-progress':
      return { ui: 'ignore', openFallback: false }
  }
}
