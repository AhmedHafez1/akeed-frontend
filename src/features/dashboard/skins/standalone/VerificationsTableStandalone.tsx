'use client'

import { useState } from 'react'
import { Ellipsis, Eye, History, RotateCcw, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { VerificationItem } from '../../model/dashboard.model'
import {
  canCancelOrder,
  cancellationMessageKey,
} from '../../domain/cancellation'
import {
  canRetryVerification,
  getVerificationLifecycleSteps,
  hasCapability,
  lifecycleTone,
} from '../../domain/verificationLifecycle'
import { lifecycleToneClasses } from './lifecycleToneClasses'
import {
  formatCreatedDate,
  formatCreatedTime,
  formatCurrencyTotal,
  formatOrderTitle,
  formatTooltipDateTime,
  resolveRowDescriptionKey,
} from '../../domain/verificationRow'

interface VerificationsTableStandaloneProps {
  verifications: VerificationItem[]
  reportingTimezone: string
  actingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  actionErrors: Record<string, string>
  canCancelOrders: boolean
  canRetryVerifications: boolean
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
  onRetryVerification: (verificationId: string) => Promise<void>
}

export function VerificationsTableStandalone(
  props: VerificationsTableStandaloneProps
) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected =
    props.verifications.find(
      (verification) => verification.id === selectedId
    ) ?? null

  const closeDetails = () => {
    if (selectedId) props.onDismissCancelOrder(selectedId)
    setSelectedId(null)
  }

  const openDetails = (verificationId: string) => {
    setSelectedId(verificationId)
  }

  const requestCancel = (verificationId: string) => {
    setSelectedId(verificationId)
    props.onRequestCancelOrder(verificationId)
  }

  return (
    <>
      <table className="hidden w-full table-fixed text-start text-sm md:table">
        <caption className="sr-only">{t('verifications.title')}</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-600">
            {[
              ['order', 'w-[17%]'],
              ['customer', 'w-[25%]'],
              ['status', 'w-[18%]'],
              ['total', 'w-[15%]'],
              ['created', 'w-[17%]'],
              ['actions', 'w-[8%]'],
            ].map(([heading, width]) => (
              <th
                key={heading}
                scope="col"
                className={cn('px-4 py-3 text-start', width)}
              >
                {t(`table.headings.${heading}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {props.verifications.map((verification) => (
            <tr
              key={verification.id}
              className="text-slate-700 transition-colors hover:bg-stone-50/70"
            >
              <td className="min-w-0 px-4 py-3">
                <p className="truncate font-semibold text-slate-950">
                  <bdi>
                    {formatOrderTitle(
                      verification,
                      t('table.orderFallbackPrefix')
                    )}
                  </bdi>
                </p>
                {verification.is_test && (
                  <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    {t('table.testBadge')}
                  </span>
                )}
              </td>
              <td className="min-w-0 px-4 py-3">
                <p className="truncate font-medium text-slate-900">
                  {verification.customer_name || t('table.unknownCustomer')}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-600">
                  {verification.customer_phone ? (
                    <bdi dir="ltr">{verification.customer_phone}</bdi>
                  ) : (
                    t('table.noPhone')
                  )}
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-md border px-2 py-1 text-xs font-semibold',
                    lifecycleToneClasses[lifecycleTone(verification.status)]
                  )}
                >
                  {t(`verificationStatus.${verification.status}`)}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">
                <bdi>{formatCurrencyTotal(verification, locale)}</bdi>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {formatCreatedDate(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}{' '}
                {formatCreatedTime(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <VerificationActionsMenu
                  {...props}
                  verification={verification}
                  onOpenDetails={openDetails}
                  onOpenCancel={requestCancel}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="grid gap-3 bg-slate-50/60 p-3 md:hidden">
        {props.verifications.map((verification) => (
          <li
            key={verification.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-950">
                  {formatOrderTitle(
                    verification,
                    t('table.orderFallbackPrefix')
                  )}
                </p>
                <span
                  className={cn(
                    'mt-2 inline-flex rounded-md border px-2 py-1 text-xs font-semibold',
                    lifecycleToneClasses[lifecycleTone(verification.status)]
                  )}
                >
                  {t(`verificationStatus.${verification.status}`)}
                </span>
              </div>
              <p className="shrink-0 text-sm font-bold text-slate-950">
                <bdi>{formatCurrencyTotal(verification, locale)}</bdi>
              </p>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="truncate text-sm font-medium text-slate-900">
                {verification.customer_name || t('table.unknownCustomer')}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {verification.customer_phone ? (
                  <bdi dir="ltr">{verification.customer_phone}</bdi>
                ) : (
                  t('table.noPhone')
                )}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-600">
              <span>
                {formatCreatedDate(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}{' '}
                {formatCreatedTime(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}
              </span>
              <VerificationActionsMenu
                {...props}
                verification={verification}
                onOpenDetails={openDetails}
                onOpenCancel={requestCancel}
              />
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && closeDetails()}
      >
        {selected && <VerificationDetails {...props} verification={selected} />}
      </Dialog>
    </>
  )
}

interface VerificationActionsMenuProps extends Omit<
  VerificationsTableStandaloneProps,
  'verifications'
> {
  verification: VerificationItem
  onOpenDetails: (verificationId: string) => void
  onOpenCancel: (verificationId: string) => void
}

function VerificationActionsMenu({
  verification,
  onOpenDetails,
  onOpenCancel,
  ...props
}: VerificationActionsMenuProps) {
  const t = useTranslations('dashboard')
  const showRetry =
    props.canRetryVerifications &&
    canRetryVerification(verification.capabilities)
  const showCancel =
    props.canCancelOrders &&
    hasCapability(
      verification.capabilities,
      'merchant_no_reply_cancellation'
    ) &&
    canCancelOrder(verification)
  const isAnyActionRunning = props.actingVerificationId !== null
  const orderTitle = formatOrderTitle(
    verification,
    t('table.orderFallbackPrefix')
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('table.actions.openMenu', { order: orderTitle })}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        >
          <Ellipsis aria-hidden="true" className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onOpenDetails(verification.id)}>
          <Eye aria-hidden="true" className="h-4 w-4" />
          {t('table.actions.details')}
        </DropdownMenuItem>
        {showRetry && (
          <DropdownMenuItem
            disabled={isAnyActionRunning}
            onSelect={() => void props.onRetryVerification(verification.id)}
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {props.actingVerificationId === verification.id
              ? t('table.actions.retrying')
              : t('table.actions.retry')}
          </DropdownMenuItem>
        )}
        {showCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              disabled={isAnyActionRunning}
              onSelect={() => onOpenCancel(verification.id)}
            >
              <XCircle aria-hidden="true" className="h-4 w-4" />
              {t('table.actions.cancelOrder')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface VerificationDetailsProps extends Omit<
  VerificationsTableStandaloneProps,
  'verifications'
> {
  verification: VerificationItem
}

function VerificationDetails(props: VerificationDetailsProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const { verification } = props
  const isActing = props.actingVerificationId === verification.id
  const isConfirming = props.confirmingCancelVerificationId === verification.id
  const showRetry =
    props.canRetryVerifications &&
    canRetryVerification(verification.capabilities)
  const showCancel =
    props.canCancelOrders &&
    hasCapability(
      verification.capabilities,
      'merchant_no_reply_cancellation'
    ) &&
    canCancelOrder(verification)
  const unavailableKey = cancellationMessageKey(verification)

  return (
    <DialogContent
      closeLabel={t('table.actions.dismiss')}
      className="!inset-y-0 [inset-inline-end:0] !top-0 !left-auto !h-dvh !w-[min(100vw,520px)] !max-w-none !translate-x-0 !translate-y-0 !overflow-y-auto !rounded-none !border-y-0 !p-0"
    >
      <DialogHeader className="border-b border-stone-200 px-5 py-5 pe-14">
        <DialogTitle className="text-xl">
          {formatOrderTitle(verification, t('table.orderFallbackPrefix'))}
        </DialogTitle>
        <DialogDescription>
          {t(resolveRowDescriptionKey(verification))}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 p-5">
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-stone-50 p-4 text-sm">
          <div>
            <p className="text-xs text-slate-600">
              {t('table.headings.customer')}
            </p>
            <p className="mt-1 font-semibold text-slate-950">
              {verification.customer_name || t('table.unknownCustomer')}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              <bdi dir="ltr">
                {verification.customer_phone || t('table.noPhone')}
              </bdi>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">
              {t('table.headings.total')}
            </p>
            <p className="mt-1 font-semibold text-slate-950">
              <bdi>{formatCurrencyTotal(verification, locale)}</bdi>
            </p>
          </div>
        </div>

        <section aria-labelledby="verification-history-title">
          <h3
            id="verification-history-title"
            className="flex items-center gap-2 font-semibold text-slate-950"
          >
            <History aria-hidden="true" className="h-4 w-4" />
            {t('table.lifecycle.label')}
          </h3>
          <ol className="mt-3 space-y-3">
            {getVerificationLifecycleSteps(verification).map((step) => {
              const stateKey = step.completedByOutcome
                ? `table.lifecycle.completedBy.${step.completedByOutcome}`
                : step.recorded
                  ? 'table.lifecycle.recorded'
                  : 'table.lifecycle.unrecorded'
              return (
                <li key={step.id} className="flex items-start gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border',
                      step.recorded
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-300 bg-white'
                    )}
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      {t(`table.lifecycle.${step.label}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {t(stateKey)}
                      {step.timestamp
                        ? ` · ${formatTooltipDateTime(
                            step.timestamp,
                            locale,
                            props.reportingTimezone
                          )}`
                        : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200 px-4 text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-600">{t('table.headings.followUp')}</dt>
            <dd className="text-end font-medium text-slate-900">
              {verification.follow_up_sent_at
                ? `${t('table.followUp.sent')} · ${formatTooltipDateTime(
                    verification.follow_up_sent_at,
                    locale,
                    props.reportingTimezone
                  )}`
                : t('table.followUp.notSent')}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-600">{t('table.headings.created')}</dt>
            <dd className="text-end font-medium text-slate-900">
              {formatTooltipDateTime(
                verification.created_at,
                locale,
                props.reportingTimezone
              )}
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-slate-600">{t('table.technicalId')}</dt>
            <dd className="mt-1 font-mono text-xs break-all text-slate-700">
              {verification.order_id}
            </dd>
          </div>
        </dl>

        {(showRetry || showCancel || unavailableKey) && (
          <section aria-labelledby="verification-actions-title">
            <h3
              id="verification-actions-title"
              className="font-semibold text-slate-950"
            >
              {t('table.headings.actions')}
            </h3>
            {isConfirming && showCancel ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm leading-6 text-red-900">
                  {t('table.actions.cancelOrderConfirmDescription')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() =>
                      void props.onConfirmCancelOrder(verification.id)
                    }
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isActing
                      ? t('table.actions.cancelingOrder')
                      : t('table.actions.confirmCancelOrder')}
                  </button>
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() => props.onDismissCancelOrder(verification.id)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  >
                    {t('table.actions.keepOrder')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {showRetry && (
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() =>
                      void props.onRetryVerification(verification.id)
                    }
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                  >
                    {isActing
                      ? t('table.actions.retrying')
                      : t('table.actions.retry')}
                  </button>
                )}
                {showCancel && (
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() => props.onRequestCancelOrder(verification.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
                  >
                    {t('table.actions.cancelOrder')}
                  </button>
                )}
              </div>
            )}
            {unavailableKey && (
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {t(`table.actions.${unavailableKey}`)}
              </p>
            )}
            {props.actionErrors[verification.id] && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {props.actionErrors[verification.id]}
              </p>
            )}
          </section>
        )}
      </div>
    </DialogContent>
  )
}
