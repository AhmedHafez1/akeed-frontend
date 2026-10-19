'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reviewPromptOptions } from '../api/reviewPromptQueries'
import {
  useAnswerReviewPrompt,
  useRecordReviewPromptImpression,
} from '../api/reviewPromptMutations'
import type { ReviewPromptAction } from '../model/reviewPrompt.model'

/**
 * The App Store review request on the dashboard: whether one is waiting,
 * recording that it was seen (once per request), and the merchant's answer.
 * The banner stays until the server has the answer; nothing hides early.
 */
export function useReviewPrompt() {
  const { data: prompt = null } = useQuery(reviewPromptOptions())
  const impression = useRecordReviewPromptImpression()
  const answerMutation = useAnswerReviewPrompt()
  const recordedId = useRef<string | null>(null)
  const recordImpression = impression.mutate
  const promptId = prompt?.id ?? null

  // Runs after the banner has rendered, which is what "shown" means.
  useEffect(() => {
    if (!promptId || recordedId.current === promptId) return
    recordedId.current = promptId
    recordImpression(promptId)
  }, [promptId, recordImpression])

  const { mutate: submit, isPending: saving } = answerMutation
  const answer = useCallback(
    (action: ReviewPromptAction) => {
      if (!promptId || saving) return
      submit({ promptId, action })
    },
    [promptId, saving, submit]
  )

  return {
    prompt,
    saving,
    failed: answerMutation.isError,
    answer,
  }
}
