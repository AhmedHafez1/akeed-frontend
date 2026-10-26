import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import type { TipCardsResponse } from '../model/tips.model'

/**
 * The tips and updates this account should see now, in the dashboard's
 * language. Refetched on focus, so a card dismissed on another device or by a
 * teammate goes away on its own. A failed read shows no cards, never an error.
 */
export function tipCardsOptions(locale: string) {
  return queryOptions({
    queryKey: queryKeys.tips.cards(locale),
    queryFn: ({ signal }) =>
      api.get<TipCardsResponse>(
        `/api/tips?locale=${encodeURIComponent(locale)}`,
        { signal }
      ),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
