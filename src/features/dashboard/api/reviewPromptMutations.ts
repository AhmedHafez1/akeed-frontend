'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import type {
  ReviewPromptActionRequest,
  ReviewPromptActionResponse,
} from '../model/reviewPrompt.model'

/**
 * Records what the merchant saw or did with the review card. Fire and forget:
 * the card has already moved on, and a lost event must not bring it back or
 * show an error for a courtesy request.
 */
export function useRecordReviewPromptAction() {
  return useMutation({
    mutationFn: (request: ReviewPromptActionRequest) =>
      api.post<ReviewPromptActionResponse>(
        '/api/review-prompt/actions',
        request
      ),
    onError: (error, request) => {
      console.warn('[ReviewPrompt] Action not recorded', {
        action: request.action,
        error,
      })
    },
  })
}
