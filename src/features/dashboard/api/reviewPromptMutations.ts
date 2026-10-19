'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, fetchWithAuth } from '@/shared/lib/auth'
import { createApiError } from '@/shared/lib/http'
import { queryKeys } from '@/shared/query/keys'
import {
  isReviewPromptClosed,
  type ReviewPromptAction,
  type ReviewPromptActionResponse,
  type ReviewPromptEnvelope,
} from '../model/reviewPrompt.model'

const promptPath = (promptId: string) =>
  `/api/review-prompt/${encodeURIComponent(promptId)}`

function useHideReviewPrompt() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.setQueryData<ReviewPromptEnvelope>(
      queryKeys.reviewPrompt.state(),
      { prompt: null }
    )
}

/**
 * Tells the server the banner was seen. Best effort: a lost impression must
 * not cost the merchant the banner, unless it says the request is closed.
 */
export function useRecordReviewPromptImpression() {
  const hide = useHideReviewPrompt()
  return useMutation({
    // The endpoint answers 204, which `api.post` would read as a broken body.
    mutationFn: async (promptId: string) => {
      const response = await fetchWithAuth(
        `${promptPath(promptId)}/impressions`,
        { method: 'POST' }
      )
      if (!response.ok) throw await createApiError(response)
    },
    onError: (error) => {
      if (isReviewPromptClosed(error)) hide()
    },
  })
}

/**
 * Records the merchant's answer, then hides the banner. A request the server
 * already closed counts as answered; any other failure keeps the banner so
 * the merchant can try again.
 */
export function useAnswerReviewPrompt() {
  const hide = useHideReviewPrompt()
  return useMutation({
    mutationFn: async ({
      promptId,
      action,
    }: {
      promptId: string
      action: ReviewPromptAction
    }) => {
      try {
        await api.post<ReviewPromptActionResponse>(
          `${promptPath(promptId)}/actions`,
          { action }
        )
      } catch (error) {
        if (!isReviewPromptClosed(error)) throw error
      }
    },
    onSuccess: hide,
  })
}
