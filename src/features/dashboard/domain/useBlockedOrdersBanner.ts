'use client'

import { useTranslations } from 'next-intl'
import { PLAN_NAME_KEYS } from '@/features/billing'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { getFormatLocale } from '@/shared/lib/locale'
import type { CapacityAction, CapacitySummary } from '../model/dashboard.model'

/** The way out the banner offers; waiting for the reset has no button. */
export type BlockedOrdersCta = Exclude<CapacityAction, 'wait_reset'>

type RenewPlanId = NonNullable<CapacitySummary['renew_plan_id']>

export interface BlockedOrdersBannerView {
  title: string
  remaining: string
  body: string
  note: string
  cta: { kind: BlockedOrdersCta; label: string } | null
  /** Buying the current paid plan again, which starts a fresh period now. */
  renew: { planId: RenewPlanId; label: string } | null
}

type BodyKeys = { dated: string; undated: string }

const BODY_KEYS: Record<CapacityAction, BodyKeys> = {
  upgrade: { dated: 'body.upgrade', undated: 'body.upgradeNoDate' },
  recharge: { dated: 'body.recharge', undated: 'body.recharge' },
  wait_reset: { dated: 'body.waitReset', undated: 'body.waitResetNoDate' },
}

/** The body when renewing is offered too; credits never renew. */
const RENEW_BODY_KEYS: Partial<Record<CapacityAction, BodyKeys>> = {
  upgrade: {
    dated: 'body.upgradeOrRenew',
    undated: 'body.upgradeOrRenewNoDate',
  },
  wait_reset: { dated: 'body.renewOrWait', undated: 'body.renewOrWaitNoDate' },
}

/** Whether there is anything to warn about: orders are waiting. */
export function hasBlockedOrders(
  capacity: CapacitySummary | null | undefined
): capacity is CapacitySummary {
  return (capacity?.blocked_count ?? 0) > 0
}

/**
 * The words of the blocked-orders warning, shared by both skins: how many
 * orders wait, what is left, and what unblocks them (upgrade, renew the
 * current paid plan, buy credits, or the allowance reset date). Null while
 * nothing is blocked.
 */
export function useBlockedOrdersBanner(
  capacity: CapacitySummary | null | undefined,
  timeZone: string
): BlockedOrdersBannerView | null {
  const t = useTranslations('dashboard.blockedOrders')
  const tPlans = useTranslations('embeddedOnboarding')
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
  const renewPlanId =
    capacity.mode === 'plan' ? (capacity.renew_plan_id ?? null) : null
  const bodyKey =
    (renewPlanId && RENEW_BODY_KEYS[capacity.action]) ||
    BODY_KEYS[capacity.action]

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
    renew: renewPlanId
      ? {
          planId: renewPlanId,
          label: t('cta.renew', { plan: tPlans(PLAN_NAME_KEYS[renewPlanId]) }),
        }
      : null,
  }
}
