import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import type { ReviewPromptView } from '../model/reviewPrompt.model'

/**
 * Whether to ask this store for a review, with the results to show. It is a
 * courtesy, not a task: a failed read shows nothing rather than an error, and
 * the card does not reappear mid-session because the tab regained focus.
 */
export function reviewPromptOptions() {
  return queryOptions({
    queryKey: queryKeys.reviewPrompt.state(),
    queryFn: ({ signal }) =>
      api.get<ReviewPromptView>('/api/review-prompt', { signal }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
}
