'use client'

import { useTranslations } from 'next-intl'
import type { NeedsActionItem } from '../model/dashboard.model'
import { needsActionRowModel, type NeedsActionRowModel } from './needsActionRow'
import { useNeedsActionReason } from './useNeedsActionReason'

/**
 * A needs-action row as both skins render it: the shared model, the badge's
 * words, and why the order waits ("No reply since Sep 30 · Reminder sent") for
 * the badge's tooltip and the card's note.
 */
export function useNeedsActionRow(
  item: NeedsActionItem,
  timeZone: string,
  canAct: boolean
): NeedsActionRowModel & { badgeText: string; reasonText: string } {
  const t = useTranslations('dashboard')
  const reason = useNeedsActionReason(item.reason, timeZone)
  const model = needsActionRowModel(item, {
    fallbackPrefix: t('table.orderFallbackPrefix'),
    canAct,
  })
  return {
    ...model,
    badgeText: t(`confirmations.status.${model.status.badge}`),
    reasonText: reason.text,
  }
}
