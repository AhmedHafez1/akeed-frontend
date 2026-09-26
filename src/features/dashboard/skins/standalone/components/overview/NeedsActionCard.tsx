'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Badge, Button, Card, buttonVariants } from '@/shared/ui'
import { hasCapability } from '@/features/dashboard/domain/verificationLifecycle'
import { useNeedsActionReason } from '@/features/dashboard/domain/useNeedsActionReason'
import type { ManualConfirmationTarget } from '@/features/dashboard/domain/useManualConfirmation'
import {
  customerDisplayName,
  formatCount,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
  whatsAppChatUrl,
} from '@/features/dashboard/lib/orderDisplay'
import type {
  DashboardOverview,
  NeedsActionItem,
} from '@/features/dashboard/model/dashboard.model'

function NeedsActionRow({
  item,
  timeZone,
  canConfirm,
  onRequestConfirm,
}: {
  item: NeedsActionItem
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
}) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const reason = useNeedsActionReason(item.reason, timeZone)
  const name = customerDisplayName(item.customer_name)
  const phone = formatPhoneInternational(item.customer_phone)
  const orderLabel =
    formatOrderNumber(item.order_number) ??
    `${t('table.orderFallbackPrefix')} ${item.order_id.slice(0, 8)}`
  const chatUrl =
    item.reason.type === 'delivery_failed'
      ? null
      : whatsAppChatUrl(item.customer_phone)
  const confirmable =
    canConfirm &&
    hasCapability(item.capabilities, 'merchant_manual_confirmation')

  return (
    <li className="grid grid-cols-1 items-center gap-3 px-5 py-4 md:grid-cols-[6rem_minmax(0,1fr)_auto_auto] md:gap-6">
      <p className="text-foreground text-sm font-semibold">
        <bdi dir="ltr">{orderLabel}</bdi>
      </p>
      <div className="min-w-0 space-y-0.5">
        <p className="text-foreground truncate text-sm font-semibold">
          {name ?? <bdi dir="ltr">{phone}</bdi>}
        </p>
        <p
          className={cn(
            'text-xs',
            reason.isCritical
              ? 'text-destructive-subtle-foreground'
              : 'text-muted-foreground'
          )}
        >
          {reason.text}
        </p>
      </div>
      <p className="text-foreground text-base font-semibold tabular-nums">
        <bdi dir="ltr">
          {formatOrderAmount(item.total_price, item.currency, locale)}
        </bdi>
      </p>
      <div className="flex items-center gap-2">
        {chatUrl && (
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('overview.needsAction.actions.whatsappLabel', {
              customer: name ?? phone,
            })}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <MessageCircle aria-hidden="true" />
            {t('overview.needsAction.actions.whatsapp')}
          </a>
        )}
        {confirmable && (
          <Button
            variant="subtle"
            size="sm"
            aria-label={t('overview.needsAction.actions.manualConfirmLabel', {
              order: orderLabel,
            })}
            onClick={() =>
              onRequestConfirm({
                verificationId: item.verification_id,
                orderLabel,
              })
            }
          >
            {t('overview.needsAction.actions.manualConfirm')}
          </Button>
        )}
      </div>
    </li>
  )
}

/**
 * The orders waiting on the merchant, highest value first (at most five), with
 * the one or two things they can do about each.
 */
export function NeedsActionCard({
  needsAction,
  timeZone,
  canConfirm,
  onRequestConfirm,
  viewAllHref,
}: {
  needsAction: DashboardOverview['needs_action']
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  viewAllHref: string
}) {
  const t = useTranslations('dashboard.overview.needsAction')
  const { locale } = useLocaleInfo()

  return (
    <Card>
      <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="text-h3 text-foreground flex items-center gap-2">
          {t('title')}
          {needsAction.count > 0 && (
            <Badge variant="warning" className="tabular-nums">
              <bdi dir="ltr">{formatCount(needsAction.count, locale)}</bdi>
            </Badge>
          )}
          <span className="sr-only">
            {t('countLabel', { count: needsAction.count })}
          </span>
        </h2>
        <Link
          href={viewAllHref}
          className="text-primary-subtle-foreground focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-sm text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('allOrders')}
          <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
        </Link>
      </div>
      {needsAction.items.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <span className="bg-success-subtle text-success-subtle-foreground flex size-10 items-center justify-center rounded-full">
            <CheckCircle2 aria-hidden="true" className="size-5" />
          </span>
          <p className="text-foreground mt-3 font-semibold">{t('empty')}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t('emptyBody')}</p>
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {needsAction.items.map((item) => (
            <NeedsActionRow
              key={item.verification_id}
              item={item}
              timeZone={timeZone}
              canConfirm={canConfirm}
              onRequestConfirm={onRequestConfirm}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
