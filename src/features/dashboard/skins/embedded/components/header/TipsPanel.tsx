'use client'

import { Fragment, useEffect, useRef } from 'react'
import { Divider, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { TipEntryEmbedded, type TipCardView } from '@/features/tips'

export interface TipsPanelProps {
  cards: TipCardView[]
  canDismiss: boolean
  onSeen: (id: string) => void
  onAction: (id: string) => void
  onDismiss: (id: string) => void
}

const FOCUSABLE = 'a[href], button:not([disabled])'

/**
 * The eligible tips and updates, in the order the server returned them.
 * Dismissing one hides it for the whole account and moves focus to the next
 * entry (or the previous, or the empty state), so the keyboard never lands
 * on nothing. Closing the panel dismisses nothing.
 */
export function TipsPanel({
  cards,
  canDismiss,
  onSeen,
  onAction,
  onDismiss,
}: TipsPanelProps) {
  const t = useTranslations('dashboard.headerTools.tips')
  const entries = useRef(new Map<string, HTMLDivElement>())
  const emptyRef = useRef<HTMLSpanElement>(null)
  // Where focus goes once a dismissed entry has left: an entry id, or null
  // for the empty state.
  const pendingFocus = useRef<{ id: string | null } | null>(null)

  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    const entry = pending.id ? entries.current.get(pending.id) : null
    // A failed dismissal brings the entry back; focus waits for the next move.
    if (pending.id && !entry) return
    pendingFocus.current = null
    if (!entry) {
      emptyRef.current?.focus()
      return
    }
    const controls = entry.querySelectorAll<HTMLElement>(FOCUSABLE)
    ;(controls[controls.length - 1] ?? entry).focus()
  }, [cards])

  const dismiss = (id: string) => {
    const index = cards.findIndex((view) => view.card.id === id)
    const neighbour = cards[index + 1] ?? cards[index - 1] ?? null
    pendingFocus.current = { id: neighbour?.card.id ?? null }
    onDismiss(id)
  }

  if (!cards.length) {
    return (
      <Text as="p" tone="subdued">
        <span ref={emptyRef} tabIndex={-1} className="outline-none">
          {t('empty')}
        </span>
      </Text>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {cards.map((view, index) => (
        <Fragment key={view.card.id}>
          {index > 0 && <Divider />}
          <TipEntryEmbedded
            ref={(node) => {
              if (node) entries.current.set(view.card.id, node)
              else entries.current.delete(view.card.id)
            }}
            view={view}
            canDismiss={canDismiss}
            onSeen={onSeen}
            onAction={onAction}
            onDismiss={dismiss}
          />
        </Fragment>
      ))}
    </div>
  )
}
