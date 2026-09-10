'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertTriangle, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { AdminMetricCard } from './AdminUi'
import type { AdminApiError } from './adminApi'
import {
  AccountSection,
  AuditTable,
  EventsTable,
  HoldsTable,
  LedgerTable,
  Mono,
  PurchasesTable,
} from './StandaloneBillingAccountSections'
import type {
  AccountDetail,
  ReconciliationReport,
} from './standalone-billing-operations.model'
import {
  formatDateTime,
  formatNumber,
  formatSigned,
} from './standaloneBillingFormat'
import { useStandaloneBillingAccount } from './useStandaloneBillingAccount'

interface StandaloneBillingAccountPageProps {
  orgId: string
}

/**
 * Staff view of one Standalone credit account: the projection, the ledger it
 * must equal, the holds and purchases behind it, and what staff did to it.
 */
export function StandaloneBillingAccountPage({
  orgId,
}: StandaloneBillingAccountPageProps) {
  const t = useTranslations('adminBillingOps')
  const { locale, isRTL } = useLocaleInfo()
  const { detail, loading, error, refresh } = useStandaloneBillingAccount(orgId)
  const Back = isRTL ? ArrowRight : ArrowLeft

  return (
    <section
      className="space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-busy={loading}
    >
      <Link
        href={`/${locale}/admin/standalone-billing`}
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-emerald-700 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
      >
        <Back className="size-4" aria-hidden="true" />
        {t('back')}
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {detail?.organization?.name ?? t('unknownOrganization')}
          </h1>
          <p className="mt-1 text-slate-500">
            <Mono>{orgId}</Mono>
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? t('refreshing') : t('refresh')}
        </Button>
      </header>

      {error && <RequestError error={error} onRetry={refresh} />}
      {loading && !detail && (
        <p role="status" className="p-8 text-center text-slate-500">
          {t('loading')}
        </p>
      )}
      {detail && <AccountBody detail={detail} />}
    </section>
  )
}

function AccountBody({ detail }: { detail: AccountDetail }) {
  const t = useTranslations('adminBillingOps')
  const { locale } = useLocaleInfo()
  const account = detail.account
  const limited = (count: number, truncated: boolean) =>
    truncated && t('truncated', { count })

  return (
    <>
      <AccessNotice detail={detail} />
      {detail.reconciliation && (
        <ReconciliationBanner report={detail.reconciliation} />
      )}
      {account ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            label={t('balance.available')}
            value={formatNumber(account.availableCredits, locale)}
            detail={t(`balanceStates.${account.balanceState}`, {
              threshold: detail.lowBalanceThreshold,
            })}
            tone={
              account.balanceState === 'ok'
                ? 'emerald'
                : account.balanceState === 'debt'
                  ? 'red'
                  : 'amber'
            }
          />
          <AdminMetricCard
            label={t('balance.posted')}
            value={formatNumber(account.postedBalance, locale)}
            detail={t(`accountStatus.${account.status}`)}
          />
          <AdminMetricCard
            label={t('balance.held')}
            value={formatNumber(account.heldCredits, locale)}
            detail={t('balance.heldDetail')}
          />
          <AdminMetricCard
            label={t('balance.debt')}
            value={formatNumber(account.debtCredits, locale)}
            detail={
              account.approvedAt
                ? t('balance.approvedAt', {
                    time: formatDateTime(account.approvedAt, locale),
                  })
                : t('balance.notApproved')
            }
            tone={account.debtCredits > 0 ? 'red' : 'neutral'}
          />
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {t('noAccount')}
        </p>
      )}

      {detail.reconciliation && (
        <ReconciliationFigures report={detail.reconciliation} />
      )}

      <AccountSection
        id="billing-holds"
        title={t('holds.title')}
        description={t('holds.description')}
        empty={t('holds.empty')}
        count={detail.holds.items.length}
        truncatedNote={limited(
          detail.holds.items.length,
          detail.holds.truncated
        )}
      >
        <HoldsTable holds={detail.holds} locale={locale} />
      </AccountSection>
      <AccountSection
        id="billing-purchases"
        title={t('purchases.title')}
        description={t('purchases.description')}
        empty={t('purchases.empty')}
        count={detail.purchases.items.length}
        truncatedNote={limited(
          detail.purchases.items.length,
          detail.purchases.truncated
        )}
      >
        <PurchasesTable purchases={detail.purchases} locale={locale} />
      </AccountSection>
      <AccountSection
        id="billing-ledger"
        title={t('ledger.title')}
        description={t('ledger.description')}
        empty={t('ledger.empty')}
        count={detail.ledger.items.length}
        truncatedNote={limited(
          detail.ledger.items.length,
          detail.ledger.truncated
        )}
      >
        <LedgerTable ledger={detail.ledger} locale={locale} />
      </AccountSection>
      <AccountSection
        id="billing-events"
        title={t('events.title')}
        description={t('events.description')}
        empty={t('events.empty')}
        count={detail.events.items.length}
        truncatedNote={limited(
          detail.events.items.length,
          detail.events.truncated
        )}
      >
        <EventsTable events={detail.events} locale={locale} />
      </AccountSection>
      <AccountSection
        id="billing-audit"
        title={t('audit.title')}
        description={t('audit.description')}
        empty={t('audit.empty')}
        count={detail.audit.items.length}
        truncatedNote={limited(
          detail.audit.items.length,
          detail.audit.truncated
        )}
      >
        <AuditTable audit={detail.audit} locale={locale} />
      </AccountSection>
    </>
  )
}

function AccessNotice({ detail }: { detail: AccountDetail }) {
  const t = useTranslations('adminBillingOps')
  const message = !detail.operations.enabled
    ? t('access.disabled')
    : !detail.operations.operator
      ? t('access.notOperator')
      : null
  if (!message) return null
  return (
    <p
      role="status"
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
    >
      {message}
    </p>
  )
}

/**
 * The one thing staff must not miss: a projection that no longer equals its
 * ledger, or source rows that contradict each other.
 */
function ReconciliationBanner({ report }: { report: ReconciliationReport }) {
  const t = useTranslations('adminBillingOps')
  const { locale } = useLocaleInfo()
  if (report.consistent && !report.contradictions.length) return null
  const contradictory = report.contradictions.length > 0
  const Icon = contradictory ? ShieldAlert : AlertTriangle
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-xl border p-4 text-sm',
        contradictory
          ? 'border-red-300 bg-red-50 text-red-950'
          : 'border-amber-300 bg-amber-50 text-amber-950'
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="space-y-2">
        <p className="font-semibold">
          {contradictory ? t('mismatch.contradictory') : t('mismatch.title')}
        </p>
        {!report.consistent && (
          <p>
            {t('mismatch.figures', {
              posted: formatNumber(report.postedBalance, locale),
              ledger: formatNumber(report.ledgerBalance, locale),
              held: formatNumber(report.heldCredits, locale),
              holds: formatNumber(report.reservationHolds, locale),
            })}
          </p>
        )}
        {contradictory ? (
          <>
            <ul className="list-disc space-y-1 ps-5">
              {report.contradictions.map((item, index) => (
                <li key={`${item.code}-${index}`}>
                  {t(`contradictions.${item.code}`)}{' '}
                  <Mono>{item.purchaseRef ?? item.reservationId}</Mono>
                </li>
              ))}
            </ul>
            <p>{t('mismatch.escalate')}</p>
          </>
        ) : (
          <p>{t('mismatch.blocked')}</p>
        )}
      </div>
    </div>
  )
}

function ReconciliationFigures({ report }: { report: ReconciliationReport }) {
  const t = useTranslations('adminBillingOps')
  const { locale } = useLocaleInfo()
  const rows = [
    {
      label: t('figures.posted'),
      projection: report.postedBalance,
      source: report.ledgerBalance,
      sourceLabel: t('figures.ledger'),
      difference: report.postedDifference,
    },
    {
      label: t('figures.held'),
      projection: report.heldCredits,
      source: report.reservationHolds,
      sourceLabel: t('figures.reservations'),
      difference: report.heldDifference,
    },
  ]
  return (
    <section
      aria-labelledby="billing-reconciliation"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="billing-reconciliation" className="text-base font-semibold">
          {t('figures.title')}
        </h2>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            report.consistent
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-amber-100 text-amber-900'
          )}
        >
          {report.consistent ? t('figures.consistent') : t('figures.drifted')}
        </span>
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">{row.label}</dt>
            <dd className="mt-1 text-sm tabular-nums">
              {t('figures.comparison', {
                projection: formatNumber(row.projection, locale),
                source: formatNumber(row.source, locale),
                sourceLabel: row.sourceLabel,
              })}
              {row.difference !== 0 && (
                <span className="ms-2 font-semibold text-amber-900" dir="ltr">
                  ({formatSigned(row.difference, locale)})
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function RequestError({
  error,
  onRetry,
}: {
  error: AdminApiError
  onRetry?: () => void
}) {
  const t = useTranslations('adminBillingOps')
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <p>{errorMessage(t, error)}</p>
      {error.requestId && (
        <p className="mt-2">
          <Mono>{error.requestId}</Mono>
        </p>
      )}
      {onRetry && (
        <Button className="mt-3" variant="outline" onClick={onRetry}>
          {t('retry')}
        </Button>
      )}
    </div>
  )
}

const ERROR_CODES = [
  'STANDALONE_BILLING_OPERATIONS_DISABLED',
  'STANDALONE_BILLING_OPERATOR_REQUIRED',
  'BILLING_ACCOUNT_NOT_FOUND',
  'BILLING_ACCOUNT_NOT_APPROVED',
  'CREDIT_PROJECTION_MISMATCH',
  'CREDIT_SOURCE_CONTRADICTORY',
  'BILLING_PREVIEW_NOT_FOUND',
  'BILLING_PREVIEW_STALE',
  'BILLING_PREVIEW_ALREADY_APPLIED',
  'BILLING_IDEMPOTENCY_KEY_REQUIRED',
  'BILLING_IDEMPOTENCY_CONFLICT',
  'BILLING_DISPATCH_NOT_FOUND',
  'BILLING_DISPATCH_NOT_CREDIT_BILLED',
  'MESSAGE_DISPATCH_RESOLUTION_CONFLICT',
  'BILLING_PURCHASE_NOT_FOUND',
  'BILLING_PURCHASE_NOT_ELIGIBLE',
  'REPAIR_SOURCE_CONTRADICTORY',
  'PAYMENT_PENDING_RECONCILIATION',
] as const

export function errorMessage(
  t: ReturnType<typeof useTranslations<'adminBillingOps'>>,
  error: AdminApiError
) {
  if (error.code && (ERROR_CODES as readonly string[]).includes(error.code))
    return t(`errors.${error.code as (typeof ERROR_CODES)[number]}`)
  if (error.status === 403) return t('errors.forbidden')
  if (error.status === 404) return t('errors.notFound')
  if (error.status === 400) return t('errors.invalid')
  if (error.status === 409) return t('errors.conflict')
  return t('errors.failed')
}
