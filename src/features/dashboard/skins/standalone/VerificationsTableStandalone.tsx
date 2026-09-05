'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type {
  ManualOrderLifecycleStatus,
  OrderItem,
} from '../../model/dashboard.model'

interface OrdersTableStandaloneProps {
  orders: OrderItem[]
  reportingTimezone: string
  actingOrderId: string | null
  confirmingCancelOrderId: string | null
  actionErrors: Record<string, string>
  canCancelOrders: boolean
  canRetryVerifications: boolean
  onRequestCancelOrder: (orderId: string) => void
  onDismissCancelOrder: (orderId: string) => void
  onConfirmCancelOrder: (orderId: string) => Promise<void>
  onRetryVerification: (orderId: string) => Promise<void>
}

const statusClasses: Record<ManualOrderLifecycleStatus, string> = {
  accepted: 'border-sky-200 bg-sky-50 text-sky-700',
  processing: 'border-blue-200 bg-blue-50 text-blue-700',
  ineligible: 'border-slate-200 bg-slate-50 text-slate-700',
  blocked: 'border-amber-200 bg-amber-50 text-amber-800',
  pending: 'border-sky-200 bg-sky-50 text-sky-700',
  sent: 'border-blue-200 bg-blue-50 text-blue-700',
  delivered: 'border-blue-200 bg-blue-50 text-blue-700',
  read: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  canceled: 'border-red-200 bg-red-50 text-red-700',
  expired: 'border-slate-200 bg-slate-50 text-slate-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
  no_reply: 'border-amber-200 bg-amber-50 text-amber-800',
  review_required: 'border-purple-200 bg-purple-50 text-purple-700',
}

const knownReasons = new Set([
  'non_cod_payment_method',
  'missing_payment_signal',
  'plan_limit_reached',
  'integration_inactive',
  'billing_not_active',
  'provider_not_accepted',
  'auto_verify_disabled',
  'onboarding_incomplete',
  'provider_outcome_unknown',
])

function canMarkCanceled(order: OrderItem): boolean {
  return (
    order.lifecycle.status === 'no_reply' &&
    order.verification?.capabilities.some(
      (capability) =>
        capability.action === 'merchant_no_reply_cancellation' &&
        capability.supported
    ) === true
  )
}

function formatMoney(
  amount: string | null,
  currency: string | null,
  locale: string
): string {
  if (!amount) return '—'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency ?? 'USD',
    }).format(Number(amount))
  } catch {
    return `${amount} ${currency ?? ''}`.trim()
  }
}

function formatDateTime(
  value: string | null,
  locale: string,
  timeZone: string
): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date)
}

export function VerificationsTableStandalone({
  orders,
  reportingTimezone,
  actingOrderId,
  confirmingCancelOrderId,
  actionErrors,
  canCancelOrders,
  canRetryVerifications,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  onRetryVerification,
}: OrdersTableStandaloneProps) {
  const t = useTranslations('dashboard.orders')
  const { isRTL, locale } = useLocaleInfo()
  const alignEnd = isRTL ? 'text-left' : 'text-right'

  return (
    <div className="-mx-6 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[800px] text-start text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <th className="px-4 py-3 text-start">{t('headings.order')}</th>
            <th className="px-4 py-3 text-start">{t('headings.lifecycle')}</th>
            <th className="px-4 py-3 text-start">{t('headings.customer')}</th>
            <th className={`px-4 py-3 ${alignEnd}`}>{t('headings.total')}</th>
            <th className={`px-4 py-3 ${alignEnd}`}>{t('headings.created')}</th>
            <th className="px-4 py-3 text-start">{t('headings.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => {
            const isActing = actingOrderId === order.id
            const isConfirming = confirmingCancelOrderId === order.id
            const reasonKey = order.lifecycle.reason
            const reason = reasonKey
              ? t(
                  knownReasons.has(reasonKey)
                    ? `reasons.${reasonKey}`
                    : 'reasons.generic'
                )
              : null
            const lifecycleDescription =
              reason ?? t(`descriptions.${order.lifecycle.status}`)
            const showRetry = canRetryVerifications && order.lifecycle.retryable
            const showCancel = canCancelOrders && canMarkCanceled(order)

            return (
              <tr
                key={order.id}
                className="align-top text-slate-700 transition-colors hover:bg-slate-50/70"
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900">
                    {order.order_number
                      ? `#${order.order_number}`
                      : t('referenceFallback')}
                    {order.is_test && (
                      <span className="ms-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        {t('testBadge')}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">
                    {order.id.slice(0, 12)}
                  </p>
                </td>
                <td className="max-w-[260px] px-4 py-4">
                  <span
                    className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClasses[order.lifecycle.status]}`}
                  >
                    {t(`status.${order.lifecycle.status}`)}
                  </span>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {lifecycleDescription}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">
                    {order.customer_name || t('unknownCustomer')}
                  </p>
                  <p dir="ltr" className="mt-1 text-xs text-slate-500">
                    {order.customer_phone}
                  </p>
                </td>
                <td className={`px-4 py-4 font-semibold ${alignEnd}`}>
                  {formatMoney(order.total_price, order.currency, locale)}
                </td>
                <td className={`px-4 py-4 text-xs ${alignEnd}`}>
                  {formatDateTime(order.created_at, locale, reportingTimezone)}
                </td>
                <td className="max-w-[280px] px-4 py-4">
                  {isConfirming ? (
                    <div className="space-y-2">
                      <p className="text-xs leading-5 text-slate-600">
                        {t('actions.markCanceledDescription')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => void onConfirmCancelOrder(order.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {isActing
                            ? t('actions.markingCanceled')
                            : t('actions.confirmMarkCanceled')}
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => onDismissCancelOrder(order.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
                        >
                          {t('actions.keepOrder')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {showRetry && (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => void onRetryVerification(order.id)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                        >
                          {isActing
                            ? t('actions.retrying')
                            : t('actions.retry')}
                        </button>
                      )}
                      {showCancel && (
                        <button
                          type="button"
                          onClick={() => onRequestCancelOrder(order.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          {t('actions.markCanceled')}
                        </button>
                      )}
                      {!showRetry && !showCancel && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  )}
                  {actionErrors[order.id] && (
                    <p role="alert" className="mt-2 text-xs text-red-600">
                      {actionErrors[order.id]}
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
