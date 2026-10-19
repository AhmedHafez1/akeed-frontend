'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { requestShopifyReview } from '@/shared/lib/shopifyReviews'
import { SHOPIFY_APP_STORE_REVIEW_URL } from '@/shared/lib/shopify-auth'
import { reviewPromptOptions } from '../api/reviewPromptQueries'
import { useRecordReviewPromptAction } from '../api/reviewPromptMutations'
import {
  REVIEW_RESULTS_THRESHOLD,
  reviewOutcomeFor,
  type ReviewPromptView,
} from '../model/reviewPrompt.model'

export type ReviewPromptStatus = 'hidden' | 'card' | 'thanks'

/** The store's results the card leads with, or null for the plain request. */
export interface ReviewPromptResults {
  confirmed: number
  canceled: number
  since: string | null
}

export interface ReviewPromptState {
  status: ReviewPromptStatus
  results: ReviewPromptResults | null
  /** A review request is open in Shopify. */
  requesting: boolean
  rate: () => void
  notNow: () => void
}

function resultsOf(view: ReviewPromptView): ReviewPromptResults | null {
  if (
    view.variant !== 'results' ||
    view.confirmed === null ||
    view.confirmed < REVIEW_RESULTS_THRESHOLD
  ) {
    return null
  }
  return {
    confirmed: view.confirmed,
    canceled: view.canceled ?? 0,
    since: view.since,
  }
}

/**
 * The App Store review card on the embedded main page. Called once per page,
 * so "shown" is recorded once per page session and the thank-you state lasts
 * across a tab switch until the next load. Nothing renders until the read
 * settles, and `enabled` keeps it off during first-run setup.
 */
export function useReviewPrompt(enabled: boolean): ReviewPromptState {
  const { data: view } = useQuery({ ...reviewPromptOptions(), enabled })
  const { mutate: record, mutateAsync: recordAsync } =
    useRecordReviewPromptAction()
  const [answer, setAnswer] = useState<'thanks' | 'hidden' | null>(null)
  const [requesting, setRequesting] = useState(false)
  const shownRecorded = useRef(false)

  const status: ReviewPromptStatus =
    answer ?? (enabled && view?.visible ? 'card' : 'hidden')

  // Runs after the card has rendered, which is what "shown" means.
  useEffect(() => {
    if (status !== 'card' || shownRecorded.current) return
    shownRecorded.current = true
    record({ action: 'shown' })
  }, [record, status])

  const rate = useCallback(async () => {
    if (requesting) return
    setRequesting(true)
    // The result is recorded after the click, so the server never sees the
    // two out of order.
    const clicked = recordAsync({ action: 'clicked' }).catch(() => undefined)
    const code = await requestShopifyReview()
    void clicked.then(() => record({ action: 'result', code }))

    const outcome = reviewOutcomeFor(code)
    if (outcome.openFallback) {
      window.open(SHOPIFY_APP_STORE_REVIEW_URL, '_blank', 'noopener,noreferrer')
    }
    if (outcome.ui === 'thanks') setAnswer('thanks')
    if (outcome.ui === 'hide') setAnswer('hidden')
    setRequesting(false)
  }, [record, recordAsync, requesting])

  const notNow = useCallback(() => {
    setAnswer('hidden')
    record({ action: 'not_now' })
  }, [record])

  return {
    status,
    results: view ? resultsOf(view) : null,
    requesting,
    rate: () => void rate(),
    notNow,
  }
}
