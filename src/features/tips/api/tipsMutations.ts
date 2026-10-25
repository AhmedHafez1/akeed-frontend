'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import type { TipCardsResponse, TipEvent } from '../model/tips.model'

/**
 * Records a first view or click. Fire and forget: `keepalive` lets a click
 * finish while the page navigates away, and a lost event never shows an error.
 */
export function recordTipEvent(
  id: string,
  event: Exclude<TipEvent, 'dismiss'>
): void {
  api
    .post(`/api/tips/${encodeURIComponent(id)}/${event}`, undefined, {
      keepalive: true,
    })
    .catch((error: unknown) => {
      console.warn('[Tips] Event not recorded', { event, error })
    })
}

/**
 * Dismisses a card for the whole account. The card leaves at once; if the
 * server refuses, it comes back and `onError` tells the merchant.
 */
export function useDismissTip(locale: string, onError: () => void) {
  const queryClient = useQueryClient()
  const key = queryKeys.tips.cards(locale)
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/tips/${encodeURIComponent(id)}/dismiss`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<TipCardsResponse>(key)
      if (previous) {
        queryClient.setQueryData<TipCardsResponse>(key, {
          ...previous,
          cards: previous.cards.filter((card) => card.id !== id),
        })
      }
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      console.warn('[Tips] Dismissal not saved', { error })
      onError()
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tips.all }),
  })
}
