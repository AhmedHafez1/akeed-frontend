import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import type { ReviewPromptEnvelope } from '../model/reviewPrompt.model'

/**
 * The review request waiting for the merchant, or null. It is a courtesy, not
 * a task: a failed read shows nothing rather than an error, and the banner
 * does not reappear mid-session because the tab regained focus.
 */
export function reviewPromptOptions() {
  return queryOptions({
    queryKey: queryKeys.reviewPrompt.state(),
    queryFn: ({ signal }) =>
      api.get<ReviewPromptEnvelope>('/api/review-prompt', { signal }),
    select: (response) => response.prompt,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
}
