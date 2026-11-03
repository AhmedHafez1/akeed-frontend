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
  event: Exclude<TipEvent, 'dismiss'>,
  generation = 1
): Promise<boolean> {
  return api
    .post<{ recorded: boolean }>(
      `/api/tips/${encodeURIComponent(id)}/${event}`,
      { delivery_generation: generation },
      {
        keepalive: true,
      }
    )
    .then((result) => result.recorded)
    .catch((error: unknown) => {
      console.warn('[Tips] Event not recorded', { event, error })
      return false
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
    mutationFn: ({ id, generation }: { id: string; generation: number }) =>
      api.post(`/api/tips/${encodeURIComponent(id)}/dismiss`, {
        delivery_generation: generation,
      }),
    onMutate: async ({ id, generation }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<TipCardsResponse>(key)
      if (previous) {
        queryClient.setQueryData<TipCardsResponse>(key, {
          ...previous,
          cards: previous.cards.filter(
            (card) =>
              card.id !== id || (card.delivery_generation ?? 1) !== generation
          ),
        })
      }
      return { previous }
    },
    onError: (error, { id, generation }, context) => {
      const previous = context?.previous
      const removed = previous?.cards.find(
        (card) =>
          card.id === id && (card.delivery_generation ?? 1) === generation
      )
      if (removed && previous)
        queryClient.setQueryData<TipCardsResponse>(key, (current) => {
          if (!current) return previous
          // A newer delivery fetched while the request failed must survive rollback.
          if (current.cards.some((card) => card.id === id)) return current
          const cards = [...current.cards]
          const position = previous.cards.findIndex((card) => card.id === id)
          cards.splice(Math.min(position, cards.length), 0, removed)
          return { ...current, cards }
        })
      console.warn('[Tips] Dismissal not saved', { error })
      onError()
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tips.all }),
  })
}
