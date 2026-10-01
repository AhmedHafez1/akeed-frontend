'use client'

import { useId } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard } from '@/shared/ui'
import { purchaseBlock } from '../../domain/balanceState'
import { formatCredits, formatMoney } from '../../domain/billingFormatters'
import type { useBillingPage } from '../../domain/useBillingPage'

interface CheckoutSummaryCardProps {
  state: ReturnType<typeof useBillingPage>
}

const noteClass =
  'rounded-ak-card text-ak-caption flex items-start gap-2.5 px-3.5 py-3'

/**
 * The order in one place: what is being bought, what it costs, the balance it
 * leaves, and the page's one primary button. Paying happens on Paymob; this
 * card only creates the checkout and hands over.
 */
export function CheckoutSummaryCard({ state }: CheckoutSummaryCardProps) {
  const t = useTranslations('billing.purchase')
  const { locale } = useLocaleInfo()
  const headingId = useId()
  const { summary } = state
  if (!summary) return null

  const currency = state.checkout?.currency ?? summary.price.currency
  const totalMinor = state.checkout?.totalMinor ?? state.totalMinor
  const isQuantityValid = !state.quantityError
  const total = formatMoney(totalMinor, currency, locale)
  const block = purchaseBlock(summary)
  // Credits bought first settle what is owed, then add to the balance.
  const balanceAfter = Math.max(
    0,
    summary.availableCredits - summary.debtCredits + state.quantity
  )
  const checkoutUrl = state.checkout?.checkoutUrl
  const payClass = cn(akButton({ variant: 'primary', size: 'lg' }), 'w-full')
  const arrow = <ArrowRight aria-hidden="true" className="rtl:rotate-180" />

  return (
    <aside
      className={cn(akCard, 'min-[1100px]:sticky min-[1100px]:top-20')}
      aria-labelledby={headingId}
    >
      <div className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
        <h2 id={headingId} className="text-ak-section text-ink">
          {t('summaryTitle')}
        </h2>
      </div>

      <div className="px-4 pb-5 sm:px-6">
        <dl className="text-ak-body">
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-ink-muted">{t('messages')}</dt>
            <dd dir="ltr" className="font-semibold tabular-nums">
              {isQuantityValid ? formatCredits(state.quantity, locale) : '—'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-ink-muted">{t('unitPrice')}</dt>
            <dd>
              <bdi className="tabular-nums">
                {formatMoney(summary.price.unitPriceMinor, currency, locale)}
              </bdi>
            </dd>
          </div>
          <div className="border-line mt-1.5 flex items-baseline justify-between gap-3 border-t pt-3.5">
            <dt className="font-semibold">{t('total')}</dt>
            <dd className="text-ak-kpi">
              {isQuantityValid ? (
                <bdi className="tabular-nums">{total}</bdi>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>

        {isQuantityValid && (
          <p className={cn(noteClass, 'bg-brand-soft text-brand-ink mt-4')}>
            <TrendingUp
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 rtl:-scale-x-100"
            />
            <span>
              {t.rich('balanceAfter', {
                count: formatCredits(balanceAfter, locale),
                b: (chunks) => (
                  <b dir="ltr" className="font-semibold tabular-nums">
                    {chunks}
                  </b>
                ),
              })}
            </span>
          </p>
        )}

        {state.checkoutError && (
          <p
            role="alert"
            className={cn(
              noteClass,
              'border-ak-danger bg-ak-danger-soft text-ak-danger mt-4 border'
            )}
          >
            {t(`errors.${state.checkoutError}`)}
          </p>
        )}

        {state.pendingReference && (
          <div
            role="status"
            className={cn(
              noteClass,
              'border-ak-warning-line bg-ak-warning-soft text-ak-warning mt-4 flex-col gap-2 border'
            )}
          >
            <p className="font-bold">{t('pendingTitle')}</p>
            <p>{t('pendingDescription')}</p>
            <Link
              href={withLocale(
                `/billing/return?purchaseRef=${encodeURIComponent(state.pendingReference)}`,
                locale
              )}
              className={akButton({ variant: 'secondary', size: 'table' })}
            >
              {t('viewStatus')}
            </Link>
          </div>
        )}
      </div>

      <div className="border-line bg-surface-sunken rounded-b-ak-card flex flex-col gap-3 border-t px-4 py-5 sm:px-6">
        {checkoutUrl ? (
          <button
            type="button"
            className={payClass}
            onClick={() => window.location.assign(checkoutUrl)}
          >
            {t('continuePaymob')}
            {arrow}
          </button>
        ) : (
          <button
            type="button"
            className={payClass}
            onClick={() => void state.createCheckout()}
            disabled={
              !state.canPurchase ||
              !isQuantityValid ||
              state.isCreating ||
              !!state.pendingReference
            }
          >
            {state.isCreating ? (
              t('creating')
            ) : isQuantityValid ? (
              <>
                <span>
                  {t.rich('pay', {
                    value: total,
                    amount: (chunks) => (
                      <bdi className="tabular-nums">{chunks}</bdi>
                    ),
                  })}
                </span>
                {arrow}
              </>
            ) : (
              t('payEmpty')
            )}
          </button>
        )}

        {(state.checkout || state.pendingReference || state.checkoutError) && (
          <button
            type="button"
            className={cn(akButton({ variant: 'secondary' }), 'w-full')}
            onClick={state.startNewPurchase}
          >
            {t('startNew')}
          </button>
        )}

        {block && (
          <p className="text-ak-caption text-ink font-semibold">
            {t(`blocked.${block}`)}
          </p>
        )}

        <p className="text-ak-caption text-ink-muted flex items-start gap-2">
          <ShieldCheck
            aria-hidden="true"
            className="text-brand mt-0.5 size-4 shrink-0"
          />
          <span>{t('paymobNote')}</span>
        </p>
      </div>
    </aside>
  )
}
