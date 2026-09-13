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
  none: 'bg-slate-100 text-slate-600',
  ok: 'bg-emerald-50 text-emerald-800',
  low: 'bg-amber-50 text-amber-900',
  zero: 'bg-orange-50 text-orange-900',
  debt: 'bg-red-50 text-red-800',
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
        <div className="mt-1 text-xs text-slate-500">
          {t('balance', {
            available: row.account.availableCredits,
            posted: row.account.postedBalance,
          })}
        </div>
        {row.freeGrantPresent && (
          <div className="mt-1 text-xs text-slate-500">{t('grantPosted')}</div>
        )}
      </>
    ) : (
      <span className="text-slate-500">{t('noAccount')}</span>
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
          <p className="text-xs text-red-800">
            {t('debt', { count: row.billing.debtCredits })}
          </p>
        )}
        {row.billing.reconciliationRequired && (
          <p className="text-xs font-medium text-amber-900">
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
      <span className="text-slate-500">{t('noAccount')}</span>
    )
  const renderSource = (row: CreditAccountRow) =>
    row.source ? (
      <div className="font-mono text-xs break-all" dir="ltr">
        {row.source.identity}
      </div>
    ) : (
      <span className="text-slate-500">{t('noSource')}</span>
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
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
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
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4"
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
          <p role="status" className="p-8 text-center text-slate-500">
            {t('loading')}
          </p>
        ) : state.page?.rows.length ? (
          <div className="relative overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
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
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="p-4">
                      <div className="font-medium">
                        {row.organizationName ?? t('missingOrganization')}
                      </div>
                      <div
                        className="mt-1 font-mono text-xs break-all text-slate-500"
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
                        className="inline-flex rounded-lg px-2 py-1 text-sm font-medium whitespace-nowrap text-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
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
          <p className="p-8 text-center text-slate-500">{t('empty')}</p>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
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
