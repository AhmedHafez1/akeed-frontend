'use client'

import { Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge, Button, Card, Input } from '@/shared/ui'
import type { useBillingPage } from '../../domain/useBillingPage'
import { CreditPackageTiles } from './CreditPackageTiles'

interface RechargePanelProps {
  state: ReturnType<typeof useBillingPage>
  id: string
}

export function RechargePanel({ state, id }: RechargePanelProps) {
  const t = useTranslations('billing')
  const { summary } = state
  if (!summary) return null

  const controlsDisabled = !state.canPurchase || state.isLocked

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
          currency={summary.price.currency}
          disabled={controlsDisabled}
          onSelect={state.selectPackage}
        />

        <div className="border-border bg-muted/30 rounded-card border p-5">
          <label
            className="text-body text-foreground font-medium"
            htmlFor="credit-quantity"
          >
            {t('packages.customLabel')}
          </label>
          <div className="mt-3 flex items-stretch">
            <Button
              variant="outline"
              size="icon"
              className="bg-background h-12 rounded-e-none"
              onClick={() => state.adjustQuantity(-1)}
              disabled={controlsDisabled}
              aria-label={t('purchase.decrease')}
            >
              <Minus />
            </Button>
            <Input
              id="credit-quantity"
              dir="ltr"
              className="bg-background h-12 rounded-none text-center text-lg font-semibold tabular-nums"
              inputMode="numeric"
              value={state.quantityInput}
              onChange={(event) => state.setQuantityInput(event.target.value)}
              disabled={controlsDisabled}
              aria-invalid={!!state.quantityError}
            />
            <Button
              variant="outline"
              size="icon"
              className="bg-background h-12 rounded-s-none"
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
      </div>
    </Card>
  )
}
