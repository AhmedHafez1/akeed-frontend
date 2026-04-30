'use client'

import { useTranslations } from 'next-intl'
import { StatusBadge } from '../../ui/shared/StatusBadge'
import type { VerificationItem } from '../../model/dashboard.model'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'

interface VerificationsTableStandaloneProps {
  verifications: VerificationItem[]
  cancelingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  cancelOrderErrors: Record<string, string>
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

export function VerificationsTableStandalone({
  verifications,
  cancelingVerificationId,
  confirmingCancelVerificationId,
  cancelOrderErrors,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
}: VerificationsTableStandaloneProps) {
  const t = useTranslations('dashboard.table')
  const { isRTL } = useLocaleInfo()
  const alignEnd = isRTL ? 'text-left' : 'text-right'

  return (
    <div className="-mx-6 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[640px] text-start text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <th className="px-4 py-3 text-start">{t('headings.order')}</th>
            <th className="px-4 py-3 text-start">{t('headings.status')}</th>
            <th className="px-4 py-3 text-start">{t('headings.customer')}</th>
            <th className={`px-4 py-3 ${alignEnd}`}>{t('headings.total')}</th>
            <th className={`px-4 py-3 ${alignEnd}`}>{t('headings.created')}</th>
            <th className="px-4 py-3 text-start">{t('headings.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {verifications.map((verification) => {
            const isConfirming = confirmingCancelVerificationId === verification.id
            const isCanceling = cancelingVerificationId === verification.id
            const cancelError = cancelOrderErrors[verification.id]

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
                </p>
                <p className="mt-0.5 font-mono text-[10px] leading-none text-slate-400">
                  {verification.order_id.slice(0, 12)}
                </p>
              </td>

              {/* Status */}
              <td className="px-4 py-3.5">
                <StatusBadge status={verification.status} />
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
                {verification.status === 'no_reply' ? (
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
                            onClick={() => onDismissCancelOrder(verification.id)}
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
                      <p className="text-xs font-medium text-red-600">
                        {cancelError}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
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
