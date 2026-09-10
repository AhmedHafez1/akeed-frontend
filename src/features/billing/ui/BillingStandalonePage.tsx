'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Gift,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { Badge, Button, Card, Input, Skeleton } from '@/shared/ui'
import {
  formatBillingDate,
  formatCredits,
  formatMoney,
} from '../domain/billingFormatters'
import type {
  CreditSummary,
  LedgerEntry,
  PurchaseSummary,
} from '../domain/billing.types'
import { useBillingPage } from '../domain/useBillingPage'

function StatusBadge({ status }: { status: CreditSummary['status'] }) {
  const t = useTranslations('billing')
  const active = status === 'active'
  return (
    <Badge
      className={
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'
          : status === 'suspended'
            ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-50'
            : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50'
      }
      variant="outline"
    >
      <span className="me-1.5 size-1.5 rounded-full bg-current" />
      {t(`status.${status}`)}
    </Badge>
  )
}

function AccountNotice({ summary }: { summary: CreditSummary }) {
  const t = useTranslations('billing')
  let tone = 'border-slate-200 bg-white text-slate-700'
  let title = t('alerts.healthyTitle')
  let description = t('alerts.healthyDescription')

  if (summary.status === 'pending_approval') {
    tone = 'border-amber-200 bg-amber-50 text-amber-950'
    title = t('alerts.pendingTitle')
    description = t('alerts.pendingDescription')
  } else if (summary.status === 'suspended') {
    tone = 'border-red-200 bg-red-50 text-red-950'
    title = t('alerts.suspendedTitle')
    description = t('alerts.suspendedDescription')
  } else if (summary.status === 'not_provisioned') {
    tone = 'border-slate-300 bg-slate-100 text-slate-800'
    title = t('alerts.notProvisionedTitle')
    description = t('alerts.notProvisionedDescription')
  } else if (summary.debtCredits > 0) {
    tone = 'border-red-200 bg-red-50 text-red-950'
    title = t('alerts.debtTitle', { count: summary.debtCredits })
    description = t('alerts.debtDescription')
  } else if (summary.availableCredits === 0) {
    tone = 'border-red-200 bg-red-50 text-red-950'
    title = t('alerts.zeroTitle')
    description = t('alerts.zeroDescription')
  } else if (summary.availableCredits <= summary.lowBalanceThreshold) {
    tone = 'border-amber-200 bg-amber-50 text-amber-950'
    title = t('alerts.lowTitle', { count: summary.availableCredits })
    description = t('alerts.lowDescription', {
      threshold: summary.lowBalanceThreshold,
    })
  }

  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${tone}`} role="status">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm opacity-85">{description}</p>
      </div>
    </div>
  )
}

function PurchaseStatusBadge({ purchase }: { purchase: PurchaseSummary }) {
  const t = useTranslations('billing')
  const color =
    purchase.status === 'successful'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : purchase.status === 'pending'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : purchase.status === 'refunded'
          ? 'border-violet-200 bg-violet-50 text-violet-800'
          : 'border-red-200 bg-red-50 text-red-800'
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className={color}>
        {t(`purchaseStatus.${purchase.status}`)}
      </Badge>
      {purchase.disputeStatus !== 'none' && (
        <Badge variant="outline">
          {t(`disputeStatus.${purchase.disputeStatus}`)}
        </Badge>
      )}
      {purchase.refundedMinor > 0 && (
        <Badge variant="outline">{t('history.refunded')}</Badge>
      )}
      {purchase.reconciliationRequired && (
        <Badge
          className="border-amber-200 bg-amber-50 text-amber-900"
          variant="outline"
        >
          {t('history.reconciliation')}
        </Badge>
      )}
    </div>
  )
}

function PurchaseHistory({
  items,
  hasMore,
  onLoadMore,
}: {
  items: PurchaseSummary[]
  hasMore: boolean
  onLoadMore: () => void
}) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-semibold text-slate-950">
          {t('history.purchases')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('history.purchasesDescription')}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">
          {t('history.purchaseEmpty')}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 md:hidden">
            {items.map((item) => (
              <li key={item.reference} className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {formatCredits(item.quantity, locale)}{' '}
                      {t('history.credits')}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatBillingDate(item.createdAt, locale)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-slate-800">
                    {formatMoney(item.totalMinor, item.currency, locale)}
                  </p>
                </div>
                <PurchaseStatusBadge purchase={item} />
                <Link
                  className="block truncate font-mono text-xs text-emerald-700 hover:underline"
                  href={withLocale(
                    `/billing/return?purchaseRef=${encodeURIComponent(item.reference)}`,
                    locale
                  )}
                >
                  <bdi>{item.reference}</bdi>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-start font-medium">
                    {t('history.date')}
                  </th>
                  <th className="px-5 py-3 text-start font-medium">
                    {t('history.credits')}
                  </th>
                  <th className="px-5 py-3 text-start font-medium">
                    {t('history.amount')}
                  </th>
                  <th className="px-5 py-3 text-start font-medium">
                    {t('history.status')}
                  </th>
                  <th className="px-5 py-3 text-start font-medium">
                    {t('history.reference')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.reference} className="align-top">
                    <td className="px-5 py-4 text-slate-600">
                      {formatBillingDate(item.createdAt, locale)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {formatCredits(item.quantity, locale)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatMoney(item.totalMinor, item.currency, locale)}
                    </td>
                    <td className="px-5 py-4">
                      <PurchaseStatusBadge purchase={item} />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="font-mono text-xs text-emerald-700 hover:underline"
                        href={withLocale(
                          `/billing/return?purchaseRef=${encodeURIComponent(item.reference)}`,
                          locale
                        )}
                      >
                        <bdi>{item.reference}</bdi>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {hasMore && (
        <div className="border-t border-slate-100 p-4 text-center">
          <Button variant="outline" onClick={onLoadMore}>
            {t('history.loadMore')}
          </Button>
        </div>
      )}
    </Card>
  )
}

function LedgerHistory({
  items,
  hasMore,
  onLoadMore,
}: {
  items: LedgerEntry[]
  hasMore: boolean
  onLoadMore: () => void
}) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-semibold text-slate-950">{t('history.ledger')}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('history.ledgerDescription')}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">
          {t('history.ledgerEmpty')}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full ${
                  item.quantity >= 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.quantity >= 0 ? (
                  <ArrowDownLeft className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {t(`ledgerReason.${item.reasonCode}`)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatBillingDate(item.createdAt, locale)} ·{' '}
                      {t(`actorType.${item.actorType}`)}
                    </p>
                  </div>
                  <div className="text-end">
                    <p
                      className={`font-semibold ${item.quantity >= 0 ? 'text-emerald-700' : 'text-slate-900'}`}
                      dir="ltr"
                    >
                      {item.quantity >= 0 ? '+' : ''}
                      {formatCredits(item.quantity, locale)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t('history.balanceAfter', {
                        count: item.postedBalanceAfter,
                      })}
                    </p>
                  </div>
                </div>
                {item.purchaseRef && (
                  <p className="mt-2 truncate font-mono text-xs text-slate-400">
                    <bdi>{item.purchaseRef}</bdi>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <div className="border-t border-slate-100 p-4 text-center">
          <Button variant="outline" onClick={onLoadMore}>
            {t('history.loadMore')}
          </Button>
        </div>
      )}
    </Card>
  )
}

export function BillingStandalonePage() {
  const t = useTranslations('billing')
  const { locale, isRTL } = useLocaleInfo()
  const state = useBillingPage()

  if (state.isSummaryLoading) {
    return (
      <section className="mx-auto max-w-[1400px] space-y-6" aria-busy>
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </section>
    )
  }

  if (!state.summary || state.summaryError) {
    return (
      <section className="mx-auto max-w-2xl py-16 text-center" role="alert">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t('error.title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('error.description')}</p>
        <Button className="mt-5" onClick={() => void state.refreshSummary()}>
          <RefreshCw /> {t('retry')}
        </Button>
      </section>
    )
  }

  const summary = state.summary
  const canAdjust = summary.canPurchase && summary.billingEnabled
  const clientTotalMinor = Number.isFinite(state.quantity)
    ? state.quantity * summary.price.unitPriceMinor
    : 0

  const adjustQuantity = (direction: -1 | 1) => {
    const base = Number.isInteger(state.quantity)
      ? state.quantity
      : summary.range.min
    const next = Math.min(
      summary.range.max,
      Math.max(summary.range.min, base + direction * summary.range.step)
    )
    state.setQuantityInput(String(next))
  }

  const metrics = [
    {
      key: 'available',
      value: summary.availableCredits,
      icon: WalletCards,
      featured: true,
    },
    {
      key: 'posted',
      value: summary.postedBalance,
      icon: Check,
      featured: false,
    },
    { key: 'held', value: summary.heldCredits, icon: Clock3, featured: false },
    {
      key: 'debt',
      value: summary.debtCredits,
      icon: AlertTriangle,
      featured: false,
    },
  ] as const

  return (
    <section
      className="mx-auto max-w-[1400px] space-y-6 pb-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            {t('eyebrow')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {t('title')}
            </h1>
            <StatusBadge status={summary.status} />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {t('description')}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {t('threshold', { count: summary.lowBalanceThreshold })}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.key}
              className={`border-slate-200 p-5 shadow-sm ${metric.featured ? 'border-emerald-200 ring-1 ring-emerald-100' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {t(`metrics.${metric.key}`)}
                  </p>
                  <p
                    className={`mt-3 text-4xl font-semibold tracking-tight ${metric.featured ? 'text-emerald-700' : 'text-slate-950'}`}
                  >
                    {formatCredits(metric.value, locale)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {t(`metrics.${metric.key}Help`)}
                  </p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600">
                  <Icon className="size-5" />
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      <AccountNotice summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {t('purchase.title')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('purchase.description')}
                </p>
              </div>
              <CreditCard className="size-5 text-emerald-700" />
            </div>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            {!summary.billingEnabled && (
              <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
                {t('purchase.disabled')}
              </p>
            )}
            {summary.billingEnabled && !summary.canPurchase && (
              <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
                {t('purchase.readOnly')}
              </p>
            )}

            <div>
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="credit-quantity"
              >
                {t('purchase.quantity')}
              </label>
              <div className="mt-2 flex max-w-md items-stretch">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 rounded-e-none"
                  onClick={() => adjustQuantity(-1)}
                  disabled={
                    !canAdjust || !!state.checkout || !!state.pendingReference
                  }
                  aria-label={t('purchase.decrease')}
                >
                  <Minus />
                </Button>
                <Input
                  id="credit-quantity"
                  className="h-11 rounded-none text-center text-base font-semibold"
                  inputMode="numeric"
                  value={state.quantityInput}
                  onChange={(event) =>
                    state.setQuantityInput(event.target.value)
                  }
                  disabled={
                    !canAdjust || !!state.checkout || !!state.pendingReference
                  }
                  aria-invalid={!!state.quantityError}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 rounded-s-none"
                  onClick={() => adjustQuantity(1)}
                  disabled={
                    !canAdjust || !!state.checkout || !!state.pendingReference
                  }
                  aria-label={t('purchase.increase')}
                >
                  <Plus />
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {t('purchase.rules', {
                  min: summary.range.min,
                  max: summary.range.max,
                  step: summary.range.step,
                })}
              </p>
              {state.quantityError && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {t(`purchase.errors.${state.quantityError}`, {
                    min: summary.range.min,
                    max: summary.range.max,
                    step: summary.range.step,
                  })}
                </p>
              )}
            </div>

            <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">
                  {t('purchase.credits')}
                </dt>
                <dd className="mt-1 font-semibold">
                  {formatCredits(
                    state.checkout?.quantity ?? (state.quantity || 0),
                    locale
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">
                  {t('purchase.unitPrice')}
                </dt>
                <dd className="mt-1 font-semibold">
                  {formatMoney(
                    state.checkout?.unitPriceMinor ??
                      summary.price.unitPriceMinor,
                    state.checkout?.currency ?? summary.price.currency,
                    locale
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">
                  {t('purchase.total')}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-emerald-700">
                  {formatMoney(
                    state.checkout?.totalMinor ?? clientTotalMinor,
                    state.checkout?.currency ?? summary.price.currency,
                    locale
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-sm font-medium">
                  {t('purchase.paymobTitle')}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t('purchase.paymobDescription')}
                </p>
              </div>
            </div>

            {state.checkoutError && (
              <p
                className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                {t(`purchase.errors.${state.checkoutError}`)}
              </p>
            )}
            {state.pendingReference && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <p className="font-semibold">{t('purchase.pendingTitle')}</p>
                <p className="mt-1 text-sm">
                  {t('purchase.pendingDescription')}
                </p>
                <Button asChild variant="outline" className="mt-3 bg-white">
                  <Link
                    href={withLocale(
                      `/billing/return?purchaseRef=${encodeURIComponent(state.pendingReference)}`,
                      locale
                    )}
                  >
                    {t('purchase.viewStatus')} <ChevronRight />
                  </Link>
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {state.checkout?.checkoutUrl ? (
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={() =>
                    window.location.assign(state.checkout!.checkoutUrl!)
                  }
                >
                  {t('purchase.continuePaymob')} <ChevronRight />
                </Button>
              ) : (
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={() => void state.createCheckout()}
                  disabled={
                    !canAdjust ||
                    !!state.quantityError ||
                    state.isCreating ||
                    !!state.pendingReference
                  }
                >
                  {state.isCreating
                    ? t('purchase.creating')
                    : t('purchase.submit')}
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
        </Card>

        <div className="space-y-6">
          <Card className="border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <Gift className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-emerald-950">
                  {t('grant.title')}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  {summary.freeGrant.granted
                    ? t('grant.granted', { count: summary.freeGrant.quantity })
                    : t('grant.pending', { count: summary.freeGrant.quantity })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">{t('terms.title')}</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {(['accepted', 'restored', 'expiry'] as const).map((key) => (
                <li key={key} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                  <span>{t(`terms.${key}`)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {state.historyError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <p>{t('history.error')}</p>
          <Button
            variant="outline"
            className="mt-3 bg-white"
            onClick={() => void state.reloadHistory()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : state.isHistoryLoading ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <PurchaseHistory
            items={state.purchases}
            hasMore={!!state.purchaseCursor}
            onLoadMore={() => void state.loadMorePurchases()}
          />
          <LedgerHistory
            items={state.ledger}
            hasMore={!!state.ledgerCursor}
            onLoadMore={() => void state.loadMoreLedger()}
          />
        </div>
      )}
    </section>
  )
}
