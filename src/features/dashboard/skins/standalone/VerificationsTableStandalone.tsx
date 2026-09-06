'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { VerificationItem } from '../../model/dashboard.model'
import {
  canCancelOrder,
  cancellationMessageKey,
} from '../../domain/cancellation'
import {
  canRetryVerification,
  lifecycleTone,
} from '../../domain/verificationLifecycle'
import { lifecycleToneClasses } from './lifecycleToneClasses'
import {
  formatCreatedDate,
  formatCreatedTime,
  formatCurrencyTotal,
  formatOrderTitle,
  formatTooltipDateTime,
  getStatusTimestamp,
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

export function VerificationsTableStandalone({
  verifications,
  reportingTimezone,
  actingVerificationId,
  confirmingCancelVerificationId,
  actionErrors,
  canCancelOrders,
  canRetryVerifications,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  onRetryVerification,
}: VerificationsTableStandaloneProps) {
  const t = useTranslations('dashboard')
  const { isRTL, locale } = useLocaleInfo()
  const alignEnd = isRTL ? 'text-left' : 'text-right'

  return (
    <div className="-mx-6 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[900px] text-start text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <th className="px-4 py-3 text-start">
              {t('table.headings.order')}
            </th>
            <th className="px-4 py-3 text-start">
              {t('table.headings.customer')}
            </th>
            <th className="px-4 py-3 text-start">
              {t('table.headings.status')}
            </th>
            <th className="px-4 py-3 text-start">
              {t('table.headings.followUp')}
            </th>
            <th className={`px-4 py-3 ${alignEnd}`}>
              {t('table.headings.total')}
            </th>
            <th className={`px-4 py-3 ${alignEnd}`}>
              {t('table.headings.created')}
            </th>
            <th className="px-4 py-3 text-start">
              {t('table.headings.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {verifications.map((verification) => {
            const isActing = actingVerificationId === verification.id
            const isConfirming =
              confirmingCancelVerificationId === verification.id
            const statusTitle = formatTooltipDateTime(
              getStatusTimestamp(verification),
              locale,
              reportingTimezone
            )
            const followUpTitle = formatTooltipDateTime(
              verification.follow_up_sent_at,
              locale,
              reportingTimezone
            )
            const showRetry =
              canRetryVerifications &&
              canRetryVerification(verification.capabilities)
            const showCancel = canCancelOrders && canCancelOrder(verification)
            const unavailableKey = cancellationMessageKey(verification)

            return (
              <tr
                key={verification.id}
                className="align-top text-slate-700 transition-colors hover:bg-slate-50/70"
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900">
                    {formatOrderTitle(
                      verification,
                      t('table.orderFallbackPrefix')
                    )}
                    {verification.is_test && (
                      <span className="ms-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        {t('table.testBadge')}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">
                    {verification.order_id.slice(0, 12)}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">
                    {verification.customer_name || t('table.unknownCustomer')}
                  </p>
                  <p dir="ltr" className="mt-1 text-xs text-slate-500">
                    {verification.customer_phone || t('table.noPhone')}
                  </p>
                </td>

                <td className="max-w-[260px] px-4 py-4">
                  <span
                    title={statusTitle || undefined}
                    className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${lifecycleToneClasses[lifecycleTone(verification.status)]}`}
                  >
                    {t(`verificationStatus.${verification.status}`)}
                  </span>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {t(resolveRowDescriptionKey(verification))}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    title={followUpTitle || undefined}
                    className={`text-xs ${verification.follow_up_sent_at ? 'text-slate-700' : 'text-slate-400'}`}
                  >
                    {verification.follow_up_sent_at
                      ? t('table.followUp.sent')
                      : t('table.followUp.notSent')}
                  </span>
                </td>

                <td className={`px-4 py-4 font-semibold ${alignEnd}`}>
                  {formatCurrencyTotal(verification, locale)}
                </td>

                <td className={`px-4 py-4 text-xs ${alignEnd}`}>
                  <p>
                    {formatCreatedDate(
                      verification.created_at,
                      locale,
                      reportingTimezone
                    )}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatCreatedTime(
                      verification.created_at,
                      locale,
                      reportingTimezone
                    )}
                  </p>
                </td>

                <td className="max-w-[280px] px-4 py-4">
                  {isConfirming ? (
                    <div className="space-y-2">
                      <p className="text-xs leading-5 text-slate-600">
                        {t('table.actions.cancelOrderConfirmDescription')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() =>
                            void onConfirmCancelOrder(verification.id)
                          }
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {isActing
                            ? t('table.actions.cancelingOrder')
                            : t('table.actions.confirmCancelOrder')}
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => onDismissCancelOrder(verification.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
                        >
                          {t('table.actions.keepOrder')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {showRetry && (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() =>
                            void onRetryVerification(verification.id)
                          }
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                        >
                          {isActing
                            ? t('table.actions.retrying')
                            : t('table.actions.retry')}
                        </button>
                      )}
                      {showCancel && (
                        <button
                          type="button"
                          onClick={() => onRequestCancelOrder(verification.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          {t('table.actions.cancelOrder')}
                        </button>
                      )}
                      {!showRetry && !showCancel && (
                        <span className="text-xs text-slate-400">
                          {unavailableKey
                            ? t(`table.actions.${unavailableKey}`)
                            : '—'}
                        </span>
                      )}
                    </div>
                  )}
                  {actionErrors[verification.id] && (
                    <p role="alert" className="mt-2 text-xs text-red-600">
                      {actionErrors[verification.id]}
                    </p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
