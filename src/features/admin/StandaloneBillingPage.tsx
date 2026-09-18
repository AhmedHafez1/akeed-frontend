'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { AdminSelect } from './AdminUi'
import { useStandaloneBilling } from './useStandaloneBilling'
import type {
  AccountFilters,
  CreditAccountRow,
} from './standalone-billing.model'
import { StandaloneBillingObservability } from './StandaloneBillingObservability'
import { StandaloneBillingSettlements } from './StandaloneBillingSettlements'

const balanceTones = {
  none: 'bg-muted text-foreground/70',
  ok: 'bg-primary-subtle text-primary-subtle-foreground',
  low: 'bg-warning-subtle text-warning-subtle-foreground',
  zero: 'bg-warning-subtle text-warning-subtle-foreground',
  debt: 'bg-destructive-subtle text-destructive-subtle-foreground',
} as const

const filterOptions: Record<keyof AccountFilters, readonly string[]> = {
  accountStatus: ['', 'active', 'suspended'],
  balance: ['', 'low', 'zero', 'debt'],
  reconciliation: ['', 'required'],
}

export function StandaloneBillingPage() {
  const t = useTranslations('adminBilling')
  const { isRTL, locale } = useLocaleInfo()
  const state = useStandaloneBilling()
  const locked = state.loading
  // Staff reads stay open to everyone; billing writes need the enabled flag
  // and a named operator, as the server enforces.
  const canOperate =
    !!state.page?.operations.enabled && !!state.page.operations.operator
  const renderAccount = (row: CreditAccountRow) =>
    row.account ? (
      <>
        <div className="font-medium">
          {t(`accountStatus.${row.account.status}`)}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          {t('balance', {
            available: row.account.availableCredits,
            posted: row.account.postedBalance,
          })}
        </div>
        {row.freeGrantPresent && (
          <div className="text-muted-foreground mt-1 text-xs">
            {t('grantPosted')}
          </div>
        )}
      </>
    ) : (
      <span className="text-muted-foreground">{t('noAccount')}</span>
    )
  const renderBilling = (row: CreditAccountRow) =>
    row.billing ? (
      <div className="space-y-1.5">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
            balanceTones[row.billing.balanceState]
          )}
        >
          {t(`balanceStates.${row.billing.balanceState}`)}
        </span>
        {row.billing.debtCredits > 0 && (
          <p className="text-destructive-subtle-foreground text-xs">
            {t('debt', { count: row.billing.debtCredits })}
          </p>
        )}
        {row.billing.reconciliationRequired && (
          <p className="text-warning-subtle-foreground text-xs font-medium">
            {!row.billing.projectionConsistent
              ? t('projectionMismatch')
              : t('reconciliationSummary', {
                  purchases: row.billing.flaggedPurchases,
                  holds: row.billing.unresolvedHolds,
                })}
          </p>
        )}
      </div>
    ) : (
      <span className="text-muted-foreground">{t('noAccount')}</span>
    )
  const renderSource = (row: CreditAccountRow) =>
    row.source ? (
      <div className="font-mono text-xs break-all" dir="ltr">
        {row.source.identity}
      </div>
    ) : (
      <span className="text-muted-foreground">{t('noSource')}</span>
    )

  return (
    <section
      className="space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-busy={locked}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-foreground/70 mt-2 max-w-3xl text-sm">
            {t('description')}
          </p>
        </div>
        <Button variant="outline" onClick={state.refresh} disabled={locked}>
          {t('refresh')}
        </Button>
      </header>
      <StandaloneBillingObservability canOperate={canOperate} />
      <StandaloneBillingSettlements canOperate={canOperate} />
      {state.error && (
        <div
          role="alert"
          className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-xl border p-4 text-sm"
        >
          <p>
            {state.error.status === 403
              ? t('accessDenied')
              : t('requestFailed')}
          </p>
          {state.error.requestId && (
            <p className="mt-2 font-mono" dir="ltr">
              {state.error.requestId}
            </p>
          )}
          {!state.page && (
            <Button className="mt-3" variant="outline" onClick={state.refresh}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}
      <div className="border-border bg-card rounded-2xl border shadow-sm">
        <div
          className="border-border grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-4"
          role="group"
          aria-label={t('filters.label')}
        >
          {(Object.keys(filterOptions) as (keyof AccountFilters)[]).map(
            (key) => (
              <AdminSelect
                key={key}
                label={t(`filters.${key}`)}
                value={state.filters[key]}
                disabled={state.loading}
                onChange={(event) =>
                  state.setFilter(
                    key,
                    event.target.value as AccountFilters[typeof key]
                  )
                }
                options={filterOptions[key].map((value) => ({
                  value,
                  label: value
                    ? t(`filters.options.${key}.${value}`)
                    : t('filters.all'),
                }))}
              />
            )
          )}
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="w-full"
              disabled={state.loading}
              onClick={state.resetFilters}
            >
              {t('filters.reset')}
            </Button>
          </div>
        </div>
        {state.loading ? (
          <p role="status" className="text-muted-foreground p-8 text-center">
            {t('loading')}
          </p>
        ) : state.page?.rows.length ? (
          <div className="relative overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-muted/50 text-foreground/70 text-xs">
                <tr>
                  <th scope="col" className="p-4 text-start">
                    {t('organization')}
                  </th>
                  <th scope="col" className="p-4 text-start">
                    {t('source')}
                  </th>
                  <th scope="col" className="p-4 text-start">
                    {t('creditAccount')}
                  </th>
                  <th scope="col" className="p-4 text-start">
                    {t('creditHealth')}
                  </th>
                  <th scope="col" className="p-4 text-start">
                    <span className="sr-only">{t('details')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.page.rows.map((row) => (
                  <tr
                    key={row.orgId}
                    className="border-border border-t align-top"
                  >
                    <td className="p-4">
                      <div className="font-medium">
                        {row.organizationName ?? t('missingOrganization')}
                      </div>
                      <div
                        className="text-muted-foreground mt-1 font-mono text-xs break-all"
                        dir="ltr"
                      >
                        {row.orgId}
                      </div>
                    </td>
                    <td className="p-4">{renderSource(row)}</td>
                    <td className="p-4">{renderAccount(row)}</td>
                    <td className="p-4">{renderBilling(row)}</td>
                    <td className="p-4">
                      <Link
                        href={`/${locale}/admin/standalone-billing/${row.orgId}`}
                        className="text-primary hover:bg-primary-subtle focus-visible:ring-ring inline-flex rounded-lg px-2 py-1 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none"
                        aria-label={t('openAccount', {
                          name: row.organizationName ?? row.orgId,
                        })}
                      >
                        {t('details')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground p-8 text-center">{t('empty')}</p>
        )}
        <div className="border-border flex justify-end gap-2 border-t p-4">
          <Button
            variant="outline"
            disabled={locked || !state.hasPrevious}
            onClick={state.previous}
          >
            {t('previous')}
          </Button>
          <Button
            variant="outline"
            disabled={locked || !state.page?.nextCursor}
            onClick={state.next}
          >
            {t('next')}
          </Button>
        </div>
      </div>
    </section>
  )
}
