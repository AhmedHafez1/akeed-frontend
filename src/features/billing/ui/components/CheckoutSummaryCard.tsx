'use client'

import Link from 'next/link'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { Button, Card } from '@/shared/ui'
import { formatMoney } from '../../domain/billingFormatters'
import type { useBillingPage } from '../../domain/useBillingPage'

interface CheckoutSummaryCardProps {
  state: ReturnType<typeof useBillingPage>
}

export function CheckoutSummaryCard({ state }: CheckoutSummaryCardProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const { summary } = state
  if (!summary) return null

  const currency = state.checkout?.currency ?? summary.price.currency
  const totalMinor = state.checkout?.totalMinor ?? state.totalMinor

  return (
    <Card className="overflow-hidden xl:sticky xl:top-6">
      <div className="border-border p-5">
        <p className="text-muted-foreground text-caption">
          {t('packages.totalLabel')}
        </p>
        <p
          dir="ltr"
          className="text-primary mt-1 text-3xl font-bold tabular-nums"
        >
          {formatMoney(totalMinor, currency, locale)}
        </p>
      </div>

      <div className="border-border space-y-4 border-t p-5">
        {state.checkoutError && (
          <p
            className="rounded-control text-body bg-red-50 p-3 text-red-900 dark:bg-red-950 dark:text-red-100"
            role="alert"
          >
            {t(`purchase.errors.${state.checkoutError}`)}
          </p>
        )}

        {state.pendingReference && (
          <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            <p className="font-semibold">{t('purchase.pendingTitle')}</p>
            <p className="text-body mt-1">{t('purchase.pendingDescription')}</p>
            <Button asChild variant="outline" className="mt-3 bg-white">
              <Link
                href={withLocale(
                  `/billing/return?purchaseRef=${encodeURIComponent(state.pendingReference)}`,
                  locale
                )}
              >
                {t('purchase.viewStatus')}
                <ChevronRight className="rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {state.checkout?.checkoutUrl ? (
            <Button
              className="w-full"
              onClick={() =>
                window.location.assign(state.checkout!.checkoutUrl!)
              }
            >
              {t('purchase.continuePaymob')}
              <ChevronRight className="rtl:rotate-180" />
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => void state.createCheckout()}
              disabled={
                !state.canPurchase ||
                !!state.quantityError ||
                state.isCreating ||
                !!state.pendingReference
              }
            >
              {state.isCreating ? t('purchase.creating') : t('packages.pay')}
              <ChevronRight className="rtl:rotate-180" />
            </Button>
          )}
          {(state.checkout ||
            state.pendingReference ||
            state.checkoutError) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={state.startNewPurchase}
            >
              {t('purchase.startNew')}
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-caption flex items-start gap-2">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
          <span>
            <span className="text-foreground font-medium">
              {t('purchase.paymobTitle')}
            </span>{' '}
            {t('purchase.paymobDescription')}
          </span>
        </p>
      </div>
    </Card>
  )
}
