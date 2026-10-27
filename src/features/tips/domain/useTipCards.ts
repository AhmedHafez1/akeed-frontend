'use client'

import { useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { queryKeys } from '@/shared/query/keys'
import { recordTipEvent, useDismissTip } from '../api/tipsMutations'
import { tipCardsOptions } from '../api/tipsQueries'
import {
  isSafeExternalUrl,
  resolveTipHref,
  type TipActionMode,
  type TipCard,
  type TipCardsResponse,
} from '../model/tips.model'

/** A card's button, resolved for this mode, or none. */
export type TipLink =
  | { kind: 'internal'; href: string; label: string }
  | { kind: 'external'; href: string; label: string }

export interface TipCardView {
  card: TipCard
  link: TipLink | null
}

/**
 * The dashboard's tip cards: what to show, and what happens on view, click
 * and dismiss. `enabled` waits for the dashboard to know its state, so cards
 * do not flash in before it settles.
 */
export function useTipCards(options: {
  mode: TipActionMode
  enabled?: boolean
  onDismissError: () => void
}) {
  const { locale } = useLocaleInfo()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const query = useQuery({
    ...tipCardsOptions(locale),
    enabled: options.enabled ?? true,
  })
  const dismiss = useDismissTip(locale, options.onDismissError)
  const viewed = useRef(new Set<string>())
  const search = searchParams.toString()

  const cards: TipCardView[] = (query.data?.cards ?? []).map((card) => ({
    card,
    link: resolveLink(card, options.mode, locale, search),
  }))

  const onSeen = useCallback(
    (id: string) => {
      if (viewed.current.has(id)) return
      viewed.current.add(id)
      void recordTipEvent(id, 'view').then(async (recorded) => {
        if (!recorded) {
          viewed.current.delete(id)
          return
        }
        // An older in-flight GET must not replace the confirmed read state.
        await queryClient.cancelQueries({ queryKey: queryKeys.tips.all })
        const readAt = new Date().toISOString()
        queryClient.setQueriesData<TipCardsResponse>(
          { queryKey: queryKeys.tips.all },
          (previous) =>
            previous
              ? {
                  ...previous,
                  cards: previous.cards.map((card) =>
                    card.id === id
                      ? {
                          ...card,
                          first_viewed_at: card.first_viewed_at ?? readAt,
                        }
                      : card
                  ),
                }
              : previous
        )
      })
    },
    [queryClient]
  )

  const onAction = useCallback(
    (id: string) => {
      if (options.mode === 'embedded') onSeen(id)
      void recordTipEvent(id, 'click')
    },
    [onSeen, options.mode]
  )

  return {
    cards,
    canDismiss: query.data?.can_dismiss === true,
    onSeen,
    onAction,
    onDismiss: (id: string) => dismiss.mutate(id),
  }
}

function resolveLink(
  card: TipCard,
  mode: TipActionMode,
  locale: string,
  search: string
): TipLink | null {
  const action = card.action
  if (!action) return null
  if (action.kind === 'external') {
    return isSafeExternalUrl(action.url)
      ? { kind: 'external', href: action.url, label: action.label }
      : null
  }
  const href = resolveTipHref(action.route, mode, locale, search)
  return href ? { kind: 'internal', href, label: action.label } : null
}
