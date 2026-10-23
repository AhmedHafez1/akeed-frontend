'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { getFormatLocale } from '@/shared/lib/locale'
import type { CapacityAction, CapacitySummary } from '../model/dashboard.model'

/** The way out the banner offers; waiting for the reset has no button. */
export type BlockedOrdersCta = Exclude<CapacityAction, 'wait_reset'>

export interface BlockedOrdersBannerView {
  title: string
  remaining: string
  body: string
  note: string
  cta: { kind: BlockedOrdersCta; label: string } | null
}

const BODY_KEYS: Record<CapacityAction, { dated: string; undated: string }> = {
  upgrade: { dated: 'body.upgrade', undated: 'body.upgradeNoDate' },
  recharge: { dated: 'body.recharge', undated: 'body.recharge' },
  wait_reset: { dated: 'body.waitReset', undated: 'body.waitResetNoDate' },
}

/** Whether there is anything to warn about: orders are waiting. */
export function hasBlockedOrders(
  capacity: CapacitySummary | null | undefined
): capacity is CapacitySummary {
  return (capacity?.blocked_count ?? 0) > 0
}

/**
 * The words of the blocked-orders warning, shared by both skins: how many
 * orders wait, what is left, and what unblocks them (upgrade, buy credits, or
 * the allowance reset date). Null while nothing is blocked.
 */
export function useBlockedOrdersBanner(
  capacity: CapacitySummary | null | undefined,
  timeZone: string
): BlockedOrdersBannerView | null {
  const t = useTranslations('dashboard.blockedOrders')
  const { locale } = useLocaleInfo()
  if (!hasBlockedOrders(capacity)) return null

  const formatLocale = getFormatLocale(locale)
  const number = new Intl.NumberFormat(formatLocale)
  const resetAt = capacity.reset_at ? new Date(capacity.reset_at) : null
  const date =
    resetAt && !Number.isNaN(resetAt.getTime())
      ? new Intl.DateTimeFormat(formatLocale, {
          dateStyle: 'medium',
          timeZone,
        }).format(resetAt)
      : null
  const bodyKey = BODY_KEYS[capacity.action]

  return {
    title: t('title', { count: number.format(capacity.blocked_count) }),
    remaining: t(
      capacity.mode === 'credits' ? 'remaining.credits' : 'remaining.plan',
      { remaining: number.format(Math.max(capacity.remaining, 0)) }
    ),
    body: date ? t(bodyKey.dated, { date }) : t(bodyKey.undated),
    note: t('note'),
    cta:
      capacity.action === 'wait_reset'
        ? null
        : { kind: capacity.action, label: t(`cta.${capacity.action}`) },
  }
}
