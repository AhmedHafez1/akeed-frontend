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
  const { locale } = useLocaleInfo()

  return (
    <div>
      <table
        role="table"
        className="block w-full text-start text-sm md:table md:table-fixed"
      >
        <caption className="sr-only">{t('verifications.title')}</caption>
        <thead
          role="rowgroup"
          className="sr-only md:not-sr-only md:table-header-group"
        >
          <tr
            role="row"
            className="border-b border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-600"
          >
            {[
              'orderCustomer',
              'status',
              'followUp',
              'total',
              'created',
              'actions',
            ].map((heading, index) => (
              <th
                key={heading}
                scope="col"
                role="columnheader"
                className={`px-2 py-4 text-start lg:px-5 ${['w-[24%]', 'w-[24%]', 'w-[8%]', 'w-[15%]', 'w-[12%]', 'w-[17%]'][index]}`}
              >
                {t(`table.headings.${heading}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          role="rowgroup"
          className="grid gap-3 bg-slate-50/50 p-3 md:table-row-group md:divide-y md:divide-slate-100 md:bg-white md:p-0"
        >
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
            const showCancel =
              canCancelOrders &&
              hasCapability(
                verification.capabilities,
                'merchant_no_reply_cancellation'
              ) &&
              canCancelOrder(verification)
            const unavailableKey = cancellationMessageKey(verification)

            return (
              <tr
                key={verification.id}
                role="row"
                className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-4 align-top text-slate-700 md:table-row md:rounded-none md:border-x-0 md:border-t-0 md:border-b md:border-slate-100 md:p-0"
              >
                <td
                  role="cell"
                  className="col-span-2 min-w-0 pb-3 md:table-cell md:px-2 md:py-4 lg:px-5"
                >
                  <p
                    className="font-semibold break-words text-slate-900"
                    title={verification.order_id}
                  >
                    <bdi>
                      {formatOrderTitle(
                        verification,
                        t('table.orderFallbackPrefix')
                      )}
                    </bdi>
                    {verification.is_test && (
                      <span className="ms-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        {t('table.testBadge')}
                      </span>
                    )}
                  </p>
                  <span className="sr-only">{verification.order_id}</span>
                  <p className="mt-1.5 text-xs leading-5 break-words text-slate-600">
                    {verification.customer_name || t('table.unknownCustomer')}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {verification.customer_phone ? (
                      <bdi dir="ltr">{verification.customer_phone}</bdi>
                    ) : (
                      t('table.noPhone')
                    )}
                  </p>
                </td>

                <td
                  role="cell"
                  className="col-span-2 min-w-0 border-t border-slate-100 py-3 md:table-cell md:border-0 md:px-2 md:py-4 lg:px-5"
                >
                  <span
                    title={statusTitle || undefined}
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${lifecycleToneClasses[lifecycleTone(verification.status)]}`}
                  >
                    {t(`verificationStatus.${verification.status}`)}
                  </span>
                  <ol
                    aria-label={t('table.lifecycle.label')}
                    className="mt-2 flex w-28 items-center"
                  >
                    {getVerificationLifecycleSteps(verification).map(
                      (step, index) => {
                        const label = `${t(`table.lifecycle.${step.label}`)}: ${t(step.completedByOutcome ? `table.lifecycle.completedBy.${step.completedByOutcome}` : step.recorded ? 'table.lifecycle.recorded' : 'table.lifecycle.unrecorded')}`
                        const timestamp = formatTooltipDateTime(
                          step.timestamp,
                          locale,
                          reportingTimezone
                        )
                        return (
                          <li
                            key={step.id}
                            className={`flex items-center ${index < 2 ? 'flex-1' : ''}`}
                          >
                            <span
                              title={`${label}${timestamp ? ` · ${timestamp}` : ''}`}
                              className={`flex size-3 shrink-0 items-center justify-center rounded-full border ${step.recorded ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`}
                            >
                              {step.recorded && (
                                <span
                                  aria-hidden="true"
                                  className="size-1 rounded-full bg-white"
                                />
                              )}
                              <span className="sr-only">
                                {label}
                                {timestamp ? ` · ${timestamp}` : ''}
                              </span>
                            </span>
                            {index < 2 && (
                              <span
                                aria-hidden="true"
                                className="h-px flex-1 bg-slate-200"
                              />
                            )}
                          </li>
                        )
                      }
                    )}
                  </ol>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {t(resolveRowDescriptionKey(verification))}
                  </p>
                </td>

                <td
                  role="cell"
                  className="col-span-2 pb-3 md:table-cell md:px-2 md:py-4 lg:px-5"
                >
                  <span className="me-2 text-xs text-slate-500 md:hidden">
                    {t('table.headings.followUp')}
                  </span>
                  <span
                    title={followUpTitle || undefined}
                    className={`text-xs ${verification.follow_up_sent_at ? 'text-slate-700' : 'text-slate-400'}`}
                  >
                    {verification.follow_up_sent_at
                      ? t('table.followUp.sent')
                      : t('table.followUp.notSent')}
                  </span>
                </td>

                <td
                  role="cell"
                  className="min-w-0 border-t border-slate-100 py-3 pe-3 font-medium break-words md:table-cell md:border-0 md:px-2 md:py-4 lg:px-5"
                >
                  <span className="mb-1 block text-xs font-normal text-slate-500 md:hidden">
                    {t('table.headings.total')}
                  </span>
                  <bdi className="text-sm md:text-xs xl:text-sm">
                    {formatCurrencyTotal(verification, locale)}
                  </bdi>
                </td>

                <td
                  role="cell"
                  className="border-t border-slate-100 py-3 text-xs md:table-cell md:border-0 md:px-2 md:py-4 lg:px-5"
                  title={formatTooltipDateTime(
                    verification.created_at,
                    locale,
                    reportingTimezone
                  )}
                >
                  <span className="mb-1 block text-xs text-slate-500 md:hidden">
                    {t('table.headings.created')}
                  </span>
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

                <td
                  role="cell"
                  className="col-span-2 border-t border-slate-100 pt-3 md:table-cell md:border-0 md:px-2 md:py-4 lg:px-5"
                >
                  <span className="mb-2 block text-xs text-slate-500 md:hidden">
                    {t('table.headings.actions')}
                  </span>
                  {isConfirming && showCancel ? (
                    <div className="space-y-2">
                      <p className="text-xs leading-5 text-slate-600">
                        {t('table.actions.cancelOrderConfirmDescription')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actingVerificationId !== null}
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
                          disabled={actingVerificationId !== null}
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
                          disabled={actingVerificationId !== null}
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
                          disabled={actingVerificationId !== null}
                          onClick={() => onRequestCancelOrder(verification.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          {t('table.actions.cancelOrder')}
                        </button>
                      )}
                      {!showRetry && !showCancel && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  )}
                  {unavailableKey && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {t(`table.actions.${unavailableKey}`)}
                    </p>
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
