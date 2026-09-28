'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Ellipsis,
  List,
  MessageCircle,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui'
import { canCancelNeedsActionItem } from '@/features/dashboard/domain/cancellation'
import { deliveryFailureKey } from '@/features/dashboard/domain/deliveryFailure'
import { hasCapability } from '@/features/dashboard/domain/verificationLifecycle'
import type { ManualConfirmationTarget } from '@/features/dashboard/domain/useManualConfirmation'
import {
  customerDisplayName,
  formatDayAndClock,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
  formatShortDate,
  waitingAge,
  whatsAppChatUrl,
} from '@/features/dashboard/lib/orderDisplay'
import type {
  DashboardOverview,
  NeedsActionItem,
} from '@/features/dashboard/model/dashboard.model'
import { InitialsAvatar } from '../shared/InitialsAvatar'
import { StatusBadge } from '../shared/StatusBadge'
import { akButton, akCard, akLink } from '../shared/akStyles'

/** What a row's badge and the line under it say, from the server's reason. */
function useReasonView(item: NeedsActionItem, timeZone: string) {
  const t = useTranslations('dashboard.standalone.needsAction')
  const tStatus = useTranslations('dashboard.confirmations.status')
  const { locale } = useLocaleInfo()
  const { reason } = item
  const date = formatShortDate(reason.since, locale, timeZone)
  const exact = reason.since
    ? formatDayAndClock(reason.since, locale, timeZone)
    : undefined

  if (reason.type === 'delivery_failed') {
    return {
      kind: 'failed' as const,
      badge: t('notDelivered'),
      sub: tStatus(`failure.${deliveryFailureKey(reason.failure_code)}`),
      exact,
    }
  }

  const age = waitingAge(reason.hours)
  const ageText = age
    ? age.unit === 'lessThanHour'
      ? t('age.lessThanHour')
      : t(`age.${age.unit}`, { count: age.count })
    : null
  const badge = !ageText
    ? tStatus('noReply')
    : reason.type === 'read_no_reply'
      ? t('readNoReply', { age: ageText })
      : t('noReply', { age: ageText })
  const sub = !date
    ? null
    : reason.type === 'read_no_reply'
      ? t('read', { date })
      : t('messaged', { date })

  return { kind: 'needsAction' as const, badge, sub, exact }
}

function NeedsActionRow({
  item,
  timeZone,
  canAct,
  onRequestConfirm,
  onRequestCancel,
  listHref,
}: {
  item: NeedsActionItem
  timeZone: string
  canAct: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onRequestCancel: (target: ManualConfirmationTarget) => void
  listHref: string
}) {
  const t = useTranslations('dashboard')
  const tRow = useTranslations('dashboard.standalone.needsAction')
  const { locale } = useLocaleInfo()
  const reason = useReasonView(item, timeZone)
  const name = customerDisplayName(item.customer_name)
  const phone = formatPhoneInternational(item.customer_phone)
  const orderLabel =
    formatOrderNumber(item.order_number) ??
    `${t('table.orderFallbackPrefix')} ${item.order_id.slice(0, 8)}`
  const target = { verificationId: item.verification_id, orderLabel }
  const chatUrl =
    item.reason.type === 'delivery_failed'
      ? null
      : whatsAppChatUrl(item.customer_phone)
  const confirmable =
    canAct && hasCapability(item.capabilities, 'merchant_manual_confirmation')
  const cancelable = canAct && canCancelNeedsActionItem(item)

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-6 py-4 lg:grid-cols-[6.5rem_minmax(0,1.25fr)_minmax(0,1fr)_auto_auto] lg:gap-x-6">
      <p className="text-ak-body text-ink order-1 font-semibold tabular-nums lg:order-none">
        <bdi dir="ltr">{orderLabel}</bdi>
      </p>

      <div className="order-3 col-span-2 flex min-w-0 items-center gap-3 lg:order-none lg:col-span-1">
        <InitialsAvatar name={name} />
        <div className="min-w-0">
          <p className="text-ak-body text-ink truncate font-semibold">
            {name ? <bdi>{name}</bdi> : <bdi dir="ltr">{phone}</bdi>}
          </p>
          {name && phone && (
            <p className="text-ak-caption text-ink-muted whitespace-nowrap tabular-nums">
              <bdi dir="ltr">{phone}</bdi>
            </p>
          )}
        </div>
      </div>

      <div className="order-4 col-span-2 flex min-w-0 flex-col items-start gap-1 lg:order-none lg:col-span-1">
        <StatusBadge
          kind={reason.kind}
          icon={reason.kind === 'needsAction' ? Clock : undefined}
          title={reason.exact}
        >
          {reason.badge}
        </StatusBadge>
        {reason.sub && (
          <p className="text-ak-caption text-ink-muted max-w-full truncate first-letter:uppercase">
            {reason.sub}
          </p>
        )}
      </div>

      <p className="text-ak-body text-ink order-2 text-end font-semibold whitespace-nowrap tabular-nums lg:order-none">
        <bdi dir="ltr">
          {formatOrderAmount(item.total_price, item.currency, locale, {
            currencyAfter: true,
          })}
        </bdi>
      </p>

      <div className="order-5 col-span-2 flex flex-wrap items-center gap-2 lg:order-none lg:col-span-1 lg:flex-nowrap lg:justify-end">
        {chatUrl && (
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('overview.needsAction.actions.whatsappLabel', {
              customer: name ?? phone,
            })}
            className={akButton({ variant: 'secondary', size: 'row' })}
          >
            <MessageCircle aria-hidden="true" />
            {tRow('whatsapp')}
          </a>
        )}
        {confirmable && (
          <button
            type="button"
            aria-label={t('overview.needsAction.actions.manualConfirmLabel', {
              order: orderLabel,
            })}
            onClick={() => onRequestConfirm(target)}
            className={akButton({ variant: 'tinted', size: 'row' })}
          >
            <Check aria-hidden="true" />
            {tRow('confirm')}
          </button>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={tRow('more', { order: orderLabel })}
              className={cn(
                akButton({ variant: 'ghost', size: 'iconRow' }),
                'ms-auto lg:ms-0'
              )}
            >
              <Ellipsis aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={listHref}>
                <List aria-hidden="true" className="size-4" />
                {tRow('viewInList')}
              </Link>
            </DropdownMenuItem>
            {cancelable && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  destructive
                  onSelect={() => onRequestCancel(target)}
                >
                  <XCircle aria-hidden="true" className="size-4" />
                  {tRow('cancel')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

/**
 * The orders waiting on the merchant, highest value first (at most five), with
 * the one or two things they can do about each and the rest behind "more".
 */
export function NeedsActionCard({
  needsAction,
  timeZone,
  canConfirm,
  onRequestConfirm,
  onRequestCancel,
  viewAllHref,
}: {
  needsAction: DashboardOverview['needs_action']
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onRequestCancel: (target: ManualConfirmationTarget) => void
  viewAllHref: string
}) {
  const t = useTranslations('dashboard.overview.needsAction')
  const tCard = useTranslations('dashboard.standalone.needsAction')
  const hasItems = needsAction.items.length > 0

  return (
    <section
      aria-labelledby="needs-action-title"
      className={cn(akCard, 'overflow-hidden')}
    >
      <div className="border-line flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b px-6 py-5">
        <div className="min-w-0 space-y-1">
          <h2
            id="needs-action-title"
            className="text-ak-section text-ink flex flex-wrap items-center gap-3"
          >
            {t('title')}
            {needsAction.count > 0 && (
              <span className="border-ak-warning-line bg-ak-warning-soft text-ak-warning text-ak-label inline-flex h-6 items-center rounded-full border px-2.5 whitespace-nowrap tabular-nums">
                {tCard('countPill', { count: needsAction.count })}
              </span>
            )}
          </h2>
        </div>
        <Link href={viewAllHref} className={cn(akLink, 'text-ak-body mt-0.5')}>
          {t('allOrders')}
          <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>
      {!hasItems ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="bg-brand-soft text-brand-ink flex size-10 items-center justify-center rounded-full">
            <CheckCircle2 aria-hidden="true" className="size-5" />
          </span>
          <p className="text-ak-body text-ink mt-3 font-semibold">
            {t('empty')}
          </p>
          <p className="text-ak-body text-ink-muted mt-1">{t('emptyBody')}</p>
        </div>
      ) : (
        <ul className="divide-line divide-y">
          {needsAction.items.map((item) => (
            <NeedsActionRow
              key={item.verification_id}
              item={item}
              timeZone={timeZone}
              canAct={canConfirm}
              onRequestConfirm={onRequestConfirm}
              onRequestCancel={onRequestCancel}
              listHref={viewAllHref}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
