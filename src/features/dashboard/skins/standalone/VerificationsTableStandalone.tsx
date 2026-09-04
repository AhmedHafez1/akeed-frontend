'use client'

import {
  canCancelOrder,
  cancellationMessageKey,
} from '@/features/dashboard/domain/cancellation'
import { useTranslations } from 'next-intl'
import { StatusBadge } from '../../ui/shared/StatusBadge'
import type { VerificationItem } from '../../model/dashboard.model'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'

interface VerificationsTableStandaloneProps {
  verifications: VerificationItem[]
  cancelingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  cancelOrderErrors: Record<string, string>
  canCancelOrders: boolean
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
}

function formatCurrency(price: string | null, currency: string | null): string {
  if (!price) return '—'
  const cur = currency ?? 'SAR'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(price))
  } catch {
    return `${price} ${cur}`
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTooltipDateTime(value: string | null, locale: string): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getStatusTimestamp(verification: VerificationItem): string | null {
  switch (verification.status) {
    case 'sent':
      return verification.last_sent_at
    case 'delivered':
      return verification.delivered_at
    case 'read':
      return verification.read_at
    case 'confirmed':
      return verification.confirmed_at
    case 'canceled':
      return verification.canceled_at
    case 'expired':
      return verification.expired_at
    case 'no_reply':
      return verification.no_reply_at
    default:
      return null
  }
}

export function VerificationsTableStandalone({
  verifications,
  cancelingVerificationId,
  confirmingCancelVerificationId,
  cancelOrderErrors,
  canCancelOrders,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
}: VerificationsTableStandaloneProps) {
  const t = useTranslations('dashboard.table')
  const { isRTL, locale } = useLocaleInfo()
  const alignEnd = isRTL ? 'text-left' : 'text-right'

  return (
    <div className="-mx-6 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[720px] text-start text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <th className="px-4 py-3 text-start">{t('headings.order')}</th>
            <th className="px-4 py-3 text-start">{t('headings.status')}</th>
            <th className="px-4 py-3 text-start">{t('headings.followUp')}</th>
            <th className="px-4 py-3 text-start">{t('headings.customer')}</th>
            <th className={`px-4 py-3 ${alignEnd}`}>{t('headings.total')}</th>
            <th className={`px-4 py-3 ${alignEnd}`}>{t('headings.created')}</th>
            <th className="px-4 py-3 text-start">{t('headings.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {verifications.map((verification) => {
            const isConfirming =
              confirmingCancelVerificationId === verification.id
            const isCanceling = cancelingVerificationId === verification.id
            const cancelError = cancelOrderErrors[verification.id]
            const statusTitle = formatTooltipDateTime(
              getStatusTimestamp(verification),
              locale
            )
            const followUpTitle = formatTooltipDateTime(
              verification.follow_up_sent_at,
              locale
            )
            const followUpLabel = verification.follow_up_sent_at
              ? t('followUp.sent')
              : t('followUp.notSent')

            return (
              <tr
                key={verification.id}
                className="text-slate-700 transition-colors hover:bg-slate-50/60"
              >
                {/* Order */}
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-slate-900">
                    {verification.order_number
                      ? `#${verification.order_number}`
                      : '—'}
                    {verification.is_test && (
                      <span className="ms-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        {t('testBadge')}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] leading-none text-slate-400">
                    {verification.order_id.slice(0, 12)}
                  </p>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span title={statusTitle || undefined}>
                    <StatusBadge status={verification.status} />
                  </span>
                </td>

                {/* Follow-up */}
                <td className="px-4 py-3.5">
                  <span
                    title={followUpTitle || undefined}
                    className={
                      verification.follow_up_sent_at
                        ? 'font-medium text-slate-700'
                        : 'text-slate-400'
                    }
                  >
                    {followUpLabel}
                  </span>
                </td>

                {/* Customer */}
                <td className="px-4 py-3.5">
                  <p className="font-medium text-slate-900">
                    {verification.customer_name || t('unknownCustomer')}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {verification.customer_phone || t('noPhone')}
                  </p>
                </td>

                {/* Total */}
                <td className={`px-4 py-3.5 ${alignEnd}`}>
                  <p className="font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(
                      verification.total_price,
                      verification.currency
                    )}
                  </p>
                </td>

                {/* Created */}
                <td className={`px-4 py-3.5 ${alignEnd}`}>
                  <p className="text-xs text-slate-600">
                    {formatDate(verification.created_at)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatTime(verification.created_at)}
                  </p>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  {canCancelOrders && canCancelOrder(verification) ? (
                    <div className="max-w-[260px] space-y-2">
                      {isConfirming ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500">
                            {t('actions.cancelOrderConfirmDescription')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isCanceling}
                              onClick={() =>
                                void onConfirmCancelOrder(verification.id)
                              }
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isCanceling
                                ? t('actions.cancelingOrder')
                                : t('actions.confirmCancelOrder')}
                            </button>
                            <button
                              type="button"
                              disabled={isCanceling}
                              onClick={() =>
                                onDismissCancelOrder(verification.id)
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {t('actions.keepOrder')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestCancelOrder(verification.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          {t('actions.cancelOrder')}
                        </button>
                      )}

                      {cancelError && (
                        <p
                          role="alert"
                          className="text-xs font-medium text-red-600"
                        >
                          {cancelError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {cancellationMessageKey(verification)
                        ? t(`actions.${cancellationMessageKey(verification)}`)
                        : '—'}
                    </span>
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
