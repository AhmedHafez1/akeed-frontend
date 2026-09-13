'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import type { SupportedLocale } from '@/shared/lib/locale'
import type {
  AuditRow,
  DetailPage,
  HoldRow,
  LedgerRow,
  ProviderEventRow,
  PurchaseRow,
} from './standalone-billing-operations.model'
import {
  AUDIT_ACTIONS,
  DISPATCH_STATES,
  RECONCILIATION_CODES,
  codeKey,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatSigned,
  isKnown,
} from './standaloneBillingFormat'

interface SectionProps {
  id: string
  title: string
  description?: string
  empty: string
  truncatedNote?: string | false
  count: number
  actions?: ReactNode
  children: ReactNode
}

/** A titled card holding one timeline; wide tables scroll inside it. */
export function AccountSection({
  id,
  title,
  description,
  empty,
  truncatedNote,
  count,
  actions,
  children,
}: SectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 id={id} className="text-base font-semibold text-slate-950">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-3xl text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
      {count ? (
        // Positioned so visually hidden headers stay inside the scroll area
        // instead of widening the page in RTL.
        <div className="relative overflow-x-auto">{children}</div>
      ) : (
        <p className="p-6 text-center text-sm text-slate-500">{empty}</p>
      )}
      {truncatedNote && (
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          {truncatedNote}
        </p>
      )}
    </section>
  )
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-xs break-all" dir="ltr">
      {children}
    </span>
  )
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th scope="col" className="p-3 text-start font-medium whitespace-nowrap">
      {children}
    </th>
  )
}

function Table({ children }: { children: ReactNode }) {
  return <table className="w-full text-start text-sm">{children}</table>
}

function Head({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50 text-xs text-slate-600">
      <tr>{children}</tr>
    </thead>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <tr className="border-t border-slate-100 align-top">{children}</tr>
}

function Td({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <td className={cn('p-3', className)}>{children}</td>
}

export function useCodeLabel() {
  const t = useTranslations('adminBillingOps')
  return {
    reconciliation: (code: string | null) =>
      !code ? (
        '—'
      ) : isKnown(RECONCILIATION_CODES, code) ? (
        t(`reconciliationCodes.${code}`)
      ) : (
        <Mono>{code}</Mono>
      ),
    dispatchState: (state: string | null) =>
      isKnown(DISPATCH_STATES, state) ? (
        t(`dispatchStates.${state}`)
      ) : (
        <Mono>{state ?? '—'}</Mono>
      ),
    auditAction: (action: string) =>
      isKnown(AUDIT_ACTIONS, action) ? (
        t(`auditActions.${codeKey(action)}`)
      ) : (
        <Mono>{action}</Mono>
      ),
  }
}

export function HoldsTable({
  holds,
  locale,
  renderAction,
}: {
  holds: DetailPage<HoldRow>
  locale: SupportedLocale
  renderAction?: (hold: HoldRow) => ReactNode
}) {
  const t = useTranslations('adminBillingOps')
  const label = useCodeLabel()
  return (
    <Table>
      <Head>
        <Th>{t('holds.created')}</Th>
        <Th>{t('holds.send')}</Th>
        <Th>{t('holds.state')}</Th>
        <Th>{t('holds.lastError')}</Th>
        <Th>{t('holds.providerId')}</Th>
        <Th>
          <span className="sr-only">{t('actions')}</span>
        </Th>
      </Head>
      <tbody>
        {holds.items.map((hold) => (
          <Row key={hold.reservationId}>
            <Td className="whitespace-nowrap">
              {formatDateTime(hold.createdAt, locale)}
            </Td>
            <Td>
              <div>
                {t(`holds.kinds.${hold.kind}`)} ·{' '}
                {t('holds.generation', { count: hold.generation })}
              </div>
              <div className="mt-1 text-slate-500">
                <Mono>{hold.dispatchId}</Mono>
              </div>
            </Td>
            <Td>
              <span
                className={cn(
                  'font-medium',
                  hold.dispatchState === 'outcome_unknown'
                    ? 'text-amber-900'
                    : 'text-slate-700'
                )}
              >
                {label.dispatchState(hold.dispatchState)}
              </span>
              {hold.attemptCount !== null && (
                <div className="mt-1 text-xs text-slate-500">
                  {t('holds.attempts', { count: hold.attemptCount })}
                </div>
              )}
            </Td>
            <Td>
              {hold.lastErrorCode ? <Mono>{hold.lastErrorCode}</Mono> : '—'}
            </Td>
            <Td>
              {hold.providerMessageIdRecorded
                ? t('holds.providerIdRecorded')
                : t('holds.providerIdMissing')}
            </Td>
            <Td className="text-end">{renderAction?.(hold)}</Td>
          </Row>
        ))}
      </tbody>
    </Table>
  )
}

export function PurchasesTable({
  purchases,
  locale,
  renderActions,
}: {
  purchases: DetailPage<PurchaseRow>
  locale: SupportedLocale
  renderActions?: (purchase: PurchaseRow) => ReactNode
}) {
  const t = useTranslations('adminBillingOps')
  const label = useCodeLabel()
  return (
    <Table>
      <Head>
        <Th>{t('purchases.reference')}</Th>
        <Th>{t('purchases.status')}</Th>
        <Th>{t('purchases.credits')}</Th>
        <Th>{t('purchases.total')}</Th>
        <Th>{t('purchases.refunded')}</Th>
        <Th>{t('purchases.reconciliation')}</Th>
        <Th>{t('purchases.created')}</Th>
        <Th>
          <span className="sr-only">{t('actions')}</span>
        </Th>
      </Head>
      <tbody>
        {purchases.items.map((purchase) => (
          <Row key={purchase.reference}>
            <Td>
              <Mono>{purchase.reference}</Mono>
              {(purchase.providerOrderId || purchase.providerTransactionId) && (
                <div className="mt-1 text-xs text-slate-500">
                  {purchase.providerOrderId && (
                    <div>
                      {t('purchases.providerOrder')}{' '}
                      <Mono>{purchase.providerOrderId}</Mono>
                    </div>
                  )}
                  {purchase.providerTransactionId && (
                    <div>
                      {t('purchases.providerTransaction')}{' '}
                      <Mono>{purchase.providerTransactionId}</Mono>
                    </div>
                  )}
                </div>
              )}
            </Td>
            <Td>
              <div className="font-medium">
                {t(`purchaseStatuses.${purchase.status}`)}
              </div>
              {purchase.disputeStatus !== 'none' && (
                <div className="mt-1 text-xs text-red-800">
                  {t(`disputeStatuses.${purchase.disputeStatus}`)}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-500">
                {t(`modes.${purchase.mode === 'live' ? 'live' : 'test'}`)}
              </div>
            </Td>
            <Td className="tabular-nums">
              {formatNumber(purchase.quantity, locale)}
            </Td>
            <Td className="whitespace-nowrap tabular-nums">
              {formatMoney(purchase.totalMinor, purchase.currency, locale)}
            </Td>
            <Td className="whitespace-nowrap tabular-nums">
              {purchase.refundedMinor
                ? formatMoney(purchase.refundedMinor, purchase.currency, locale)
                : '—'}
            </Td>
            <Td>
              {purchase.reconciliationRequired ? (
                <div className="text-amber-900">
                  <div className="font-medium">
                    {label.reconciliation(purchase.reconciliationCode)}
                  </div>
                  <div className="mt-1 text-xs">
                    {t('purchases.attempts', {
                      count: purchase.reconciliationAttempts,
                    })}
                  </div>
                </div>
              ) : (
                <span className="text-slate-500">
                  {t('purchases.noReconciliation')}
                </span>
              )}
            </Td>
            <Td className="whitespace-nowrap">
              {formatDateTime(purchase.createdAt, locale)}
            </Td>
            <Td className="text-end">{renderActions?.(purchase)}</Td>
          </Row>
        ))}
      </tbody>
    </Table>
  )
}

export function LedgerTable({
  ledger,
  locale,
}: {
  ledger: DetailPage<LedgerRow>
  locale: SupportedLocale
}) {
  const t = useTranslations('adminBillingOps')
  return (
    <Table>
      <Head>
        <Th>{t('ledger.date')}</Th>
        <Th>{t('ledger.type')}</Th>
        <Th>{t('ledger.quantity')}</Th>
        <Th>{t('ledger.balance')}</Th>
        <Th>{t('ledger.reference')}</Th>
        <Th>{t('ledger.reason')}</Th>
      </Head>
      <tbody>
        {ledger.items.map((entry) => (
          <Row key={entry.id}>
            <Td className="whitespace-nowrap">
              {formatDateTime(entry.createdAt, locale)}
            </Td>
            <Td className="font-medium">{t(`ledgerTypes.${entry.type}`)}</Td>
            <Td
              className={cn(
                'font-medium tabular-nums',
                entry.quantity < 0 ? 'text-red-800' : 'text-emerald-800'
              )}
            >
              <span dir="ltr">{formatSigned(entry.quantity, locale)}</span>
            </Td>
            <Td className="whitespace-nowrap tabular-nums">
              <span dir="ltr">
                {formatNumber(entry.postedBalanceBefore, locale)} →{' '}
                {formatNumber(entry.postedBalanceAfter, locale)}
              </span>
            </Td>
            <Td className="space-y-1">
              {entry.purchaseRef && (
                <div>
                  <Mono>{entry.purchaseRef}</Mono>
                </div>
              )}
              {entry.sourceReference && (
                <div className="text-xs text-slate-500">
                  {t('ledger.providerReference')}{' '}
                  <Mono>{entry.sourceReference}</Mono>
                </div>
              )}
              {entry.dispatchId && (
                <div className="text-xs text-slate-500">
                  {t('ledger.dispatch')} <Mono>{entry.dispatchId}</Mono>
                </div>
              )}
              {!entry.purchaseRef && !entry.dispatchId && '—'}
            </Td>
            <Td>
              <div className="max-w-xs break-words">{entry.reason}</div>
              {entry.actorId && (
                <div className="mt-1 text-xs text-slate-500">
                  {t('ledger.actor')} <Mono>{entry.actorId}</Mono>
                </div>
              )}
            </Td>
          </Row>
        ))}
      </tbody>
    </Table>
  )
}

export function EventsTable({
  events,
  locale,
}: {
  events: DetailPage<ProviderEventRow>
  locale: SupportedLocale
}) {
  const t = useTranslations('adminBillingOps')
  return (
    <Table>
      <Head>
        <Th>{t('events.received')}</Th>
        <Th>{t('events.provider')}</Th>
        <Th>{t('events.purchase')}</Th>
        <Th>{t('events.result')}</Th>
        <Th>{t('events.verified')}</Th>
      </Head>
      <tbody>
        {events.items.map((event) => (
          <Row key={event.id}>
            <Td className="whitespace-nowrap">
              {formatDateTime(event.receivedAt, locale)}
            </Td>
            <Td>
              {event.provider === 'akeed_staff' ? (
                t('events.staffEvidence')
              ) : (
                <Mono>{event.provider}</Mono>
              )}
            </Td>
            <Td>
              {event.purchaseRef ? <Mono>{event.purchaseRef}</Mono> : '—'}
            </Td>
            <Td>
              <Mono>{event.resultCode}</Mono>
              {event.errorCode && (
                <div className="mt-1 text-xs text-amber-900">
                  <Mono>{event.errorCode}</Mono>
                </div>
              )}
            </Td>
            <Td>{event.verified ? t('events.yes') : t('events.no')}</Td>
          </Row>
        ))}
      </tbody>
    </Table>
  )
}

const AUDIT_SUMMARY_FIELDS = [
  'reason',
  'evidence',
  'quantity',
  'resolution',
  'providerAction',
  'providerReference',
  'amountMinor',
  'outcome',
  'postedDifference',
  'heldDifference',
] as const

export function AuditTable({
  audit,
  locale,
}: {
  audit: DetailPage<AuditRow>
  locale: SupportedLocale
}) {
  const t = useTranslations('adminBillingOps')
  const label = useCodeLabel()
  return (
    <Table>
      <Head>
        <Th>{t('audit.date')}</Th>
        <Th>{t('audit.action')}</Th>
        <Th>{t('audit.actor')}</Th>
        <Th>{t('audit.details')}</Th>
      </Head>
      <tbody>
        {audit.items.map((row) => (
          <Row key={row.id}>
            <Td className="whitespace-nowrap">
              {formatDateTime(row.createdAt, locale)}
            </Td>
            <Td className="font-medium">{label.auditAction(row.action)}</Td>
            <Td>
              {row.actorId ? <Mono>{row.actorId}</Mono> : '—'}
              {row.requestId && (
                <div className="mt-1 text-xs text-slate-500">
                  {t('audit.request')} <Mono>{row.requestId}</Mono>
                </div>
              )}
            </Td>
            <Td>
              <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                {AUDIT_SUMMARY_FIELDS.filter(
                  (field) =>
                    row.summary[field] !== undefined &&
                    row.summary[field] !== null
                ).map((field) => (
                  <div key={field} className="contents">
                    <dt className="text-slate-500">
                      {t(`audit.fields.${field}`)}
                    </dt>
                    <dd className="break-words text-slate-800">
                      {String(row.summary[field])}
                    </dd>
                  </div>
                ))}
              </dl>
            </Td>
          </Row>
        ))}
      </tbody>
    </Table>
  )
}
