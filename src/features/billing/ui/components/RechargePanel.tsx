'use client'

import Link from 'next/link'
import { ChevronRight, Minus, Plus, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { Badge, Button, Card, Input } from '@/shared/ui'
import { formatMoney } from '../../domain/billingFormatters'
import type { useBillingPage } from '../../domain/useBillingPage'
import { CreditPackageTiles } from './CreditPackageTiles'

interface RechargePanelProps {
  state: ReturnType<typeof useBillingPage>
  id: string
}

export function RechargePanel({ state, id }: RechargePanelProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const { summary } = state
  if (!summary) return null

  const controlsDisabled = !state.canPurchase || state.isLocked
  const currency = state.checkout?.currency ?? summary.price.currency
  const totalMinor = state.checkout?.totalMinor ?? state.totalMinor

  return (
    <Card id={id} className="scroll-mt-24 overflow-hidden">
      <div className="border-border flex items-start justify-between gap-3 border-b p-5 sm:p-6">
        <div>
          <h2 className="text-h3 text-foreground">{t('purchase.title')}</h2>
          <p className="text-muted-foreground text-body mt-1">
            {t('purchase.description')}
          </p>
        </div>
        <Badge variant="neutral" className="shrink-0">
          {t('packages.stepLabel')}
        </Badge>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {!summary.billingEnabled && (
          <p className="rounded-control bg-muted text-body text-foreground p-3">
            {t('purchase.disabled')}
          </p>
        )}
        {summary.billingEnabled && !summary.canPurchase && (
          <p className="rounded-control bg-muted text-body text-foreground p-3">
            {t('purchase.readOnly')}
          </p>
        )}

        <CreditPackageTiles
          packages={state.packages}
          selected={state.selectedPackage}
          unitPriceMinor={summary.price.unitPriceMinor}
          currency={summary.price.currency}
          disabled={controlsDisabled}
          onSelect={state.selectPackage}
        />

        <div className="border-border rounded-card border p-4">
          <label
            className="text-body text-foreground font-medium"
            htmlFor="credit-quantity"
          >
            {t('packages.customLabel')}
          </label>
          <div className="mt-2 flex items-stretch">
            <Button
              variant="outline"
              size="icon"
              className="h-11 rounded-e-none"
              onClick={() => state.adjustQuantity(-1)}
              disabled={controlsDisabled}
              aria-label={t('purchase.decrease')}
            >
              <Minus />
            </Button>
            <Input
              id="credit-quantity"
              dir="ltr"
              className="h-11 rounded-none text-center text-base font-semibold tabular-nums"
              inputMode="numeric"
              value={state.quantityInput}
              onChange={(event) => state.setQuantityInput(event.target.value)}
              disabled={controlsDisabled}
              aria-invalid={!!state.quantityError}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-11 rounded-s-none"
              onClick={() => state.adjustQuantity(1)}
              disabled={controlsDisabled}
              aria-label={t('purchase.increase')}
            >
              <Plus />
            </Button>
          </div>
          <p className="text-muted-foreground text-caption mt-2">
            {t('purchase.rules', {
              min: summary.range.min,
              max: summary.range.max,
              step: summary.range.step,
            })}
          </p>
          {state.quantityError && (
            <p className="text-destructive text-body mt-2" role="alert">
              {t(`purchase.errors.${state.quantityError}`, {
                min: summary.range.min,
                max: summary.range.max,
                step: summary.range.step,
              })}
            </p>
          )}
        </div>

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

        <div className="border-border flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-muted-foreground text-caption">
              {t('packages.totalLabel')}
            </p>
            <p className="text-primary mt-1 text-2xl font-bold">
              {formatMoney(totalMinor, currency, locale)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {state.checkout?.checkoutUrl ? (
              <Button
                onClick={() =>
                  window.location.assign(state.checkout!.checkoutUrl!)
                }
              >
                {t('purchase.continuePaymob')}
                <ChevronRight className="rtl:rotate-180" />
              </Button>
            ) : (
              <Button
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
              <Button variant="outline" onClick={state.startNewPurchase}>
                {t('purchase.startNew')}
              </Button>
            )}
          </div>
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
