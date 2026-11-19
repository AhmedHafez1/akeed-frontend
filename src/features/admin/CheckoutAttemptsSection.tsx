'use client'

import Link from 'next/link'
import { Mail, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui'
import { SegmentedControl } from '@/shared/ui/segmented-control'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  CHECKOUT_PAID_FILTERS,
  paidEarlier,
  readableCode,
  whatsappChatUrl,
  type CheckoutAttemptRow,
  type CheckoutOutcome,
} from './checkout-attempts.model'
import { formatDateTime, formatMoney } from './standaloneBillingFormat'
import { useCheckoutAttempts } from './useCheckoutAttempts'

const outcomeTones: Record<CheckoutOutcome, string> = {
  paid: 'bg-success-subtle text-success-subtle-foreground',
  declined: 'bg-destructive-subtle text-destructive-subtle-foreground',
  failed: 'bg-destructive-subtle text-destructive-subtle-foreground',
  canceled: 'bg-warning-subtle text-warning-subtle-foreground',
  left_checkout: 'bg-warning-subtle text-warning-subtle-foreground',
  in_checkout: 'bg-muted text-foreground',
}

const contactClass =
  'border-border text-primary hover:bg-primary-subtle focus-visible:ring-ring inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none'

/** Merchants who opened Paymob checkout, for staff to follow up. */
export function CheckoutAttemptsSection() {
  const t = useTranslations('adminBilling.checkoutAttempts')
  const { locale } = useLocaleInfo()
  const state = useCheckoutAttempts()
  const rows = state.page?.rows ?? []

  const outcome = (row: CheckoutAttemptRow) => (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={cn(
          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
          outcomeTones[row.latest.outcome]
        )}
      >
        {row.latest.outcome === 'declined' && row.latest.declineCode
          ? t('outcome.declinedWith', {
              reason: readableCode(row.latest.declineCode),
            })
          : t(`outcome.${row.latest.outcome}`)}
      </span>
      {paidEarlier(row) && (
        <span className="text-success-subtle-foreground text-xs font-medium">
          {t('paidEarlier')}
        </span>
      )}
    </span>
  )

  const contact = (row: CheckoutAttemptRow) => {
    const chat = whatsappChatUrl(row.owner.whatsappPhone)
    const who = row.owner.name ?? row.organizationName ?? row.orgId
    return (
      <span className="inline-flex items-center gap-1.5">
        {chat && (
          <a
            href={chat}
            target="_blank"
            rel="noopener noreferrer"
            className={contactClass}
            aria-label={t('whatsappTo', { name: who })}
          >
            <MessageCircle className="size-3.5" aria-hidden />
            <span dir="ltr" className="tabular-nums">
              {row.owner.whatsappPhone}
            </span>
          </a>
        )}
        {row.owner.email && (
          <a
            href={`mailto:${row.owner.email}`}
            className={contactClass}
            aria-label={t('emailTo', { name: who, email: row.owner.email })}
            title={row.owner.email}
          >
            <Mail className="size-3.5" aria-hidden />
            {t('email')}
          </a>
        )}
        {!chat && !row.owner.email && (
          <span className="text-muted-foreground text-xs">
            {t('noContact')}
          </span>
        )}
      </span>
    )
  }

  const merchant = (row: CheckoutAttemptRow) => (
    <>
      <div className="font-medium">
        <bdi>{row.organizationName ?? t('missingOrganization')}</bdi>
      </div>
      {row.source && (
        <div className="text-muted-foreground mt-0.5 text-xs" dir="ltr">
          {row.source.platformType}
        </div>
      )}
    </>
  )

  const details = (row: CheckoutAttemptRow) => (
    <Link
      href={`/${locale}/admin/standalone-billing/${row.orgId}`}
      className="text-primary hover:bg-primary-subtle focus-visible:ring-ring inline-flex rounded-lg px-2 py-1 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none"
      aria-label={t('openAccount', {
        name: row.organizationName ?? row.orgId,
      })}
    >
      {t('details')}
    </Link>
  )

  const amount = (row: CheckoutAttemptRow) =>
    formatMoney(row.latest.totalMinor, row.latest.currency, locale)

  return (
    <section
      className="border-border bg-card rounded-2xl border shadow-sm"
      aria-labelledby="checkout-attempts-title"
      aria-busy={state.loading}
    >
      <div className="border-border flex flex-wrap items-end justify-between gap-3 border-b p-4">
        <div>
          <h2 id="checkout-attempts-title" className="text-lg font-semibold">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('description')}
          </p>
        </div>
        <SegmentedControl
          aria-label={t('filterLabel')}
          value={state.paid}
          onChange={state.setPaid}
          options={CHECKOUT_PAID_FILTERS.map((value) => ({
            value,
            label: t(`filters.${value}`),
          }))}
        />
      </div>

      {state.error ? (
        <div
          role="alert"
          className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground m-4 rounded-xl border p-4 text-sm"
        >
          <p>{state.error.status === 403 ? t('accessDenied') : t('error')}</p>
          <Button className="mt-3" variant="outline" onClick={state.refresh}>
            {t('retry')}
          </Button>
        </div>
      ) : state.loading && !state.page ? (
        <p role="status" className="text-muted-foreground p-8 text-center">
          {t('loading')}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground p-8 text-center">
          {state.paid === 'unpaid' ? t('emptyUnpaid') : t('empty')}
        </p>
      ) : (
        <>
          <div className="relative hidden overflow-x-auto md:block">
            <table className="w-full text-start text-sm">
              <thead className="bg-muted/50 text-foreground/70 text-xs">
                <tr>
                  {(
                    [
                      'merchant',
                      'owner',
                      'attempts',
                      'lastAttempt',
                      'amount',
                      'result',
                    ] as const
                  ).map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-start font-medium whitespace-nowrap"
                    >
                      {t(`columns.${column}`)}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">{t('details')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.orgId} className="border-border border-t">
                    <td className="px-4 py-3">{merchant(row)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        {row.owner.name && <bdi>{row.owner.name}</bdi>}
                        {contact(row)}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.attempts}</td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {formatDateTime(row.lastAttemptAt, locale)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {amount(row)}
                    </td>
                    <td className="px-4 py-3">{outcome(row)}</td>
                    <td className="px-4 py-3 text-end">{details(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="md:hidden">
            {rows.map((row) => (
              <li key={row.orgId} className="border-border border-t px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>{merchant(row)}</div>
                  {outcome(row)}
                </div>
                <p className="text-muted-foreground mt-1.5 text-xs tabular-nums">
                  {row.owner.name && <bdi>{row.owner.name} · </bdi>}
                  {t('summary', {
                    attempts: row.attempts,
                    amount: amount(row),
                    when: formatDateTime(row.lastAttemptAt, locale),
                  })}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  {contact(row)}
                  {details(row)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="border-border flex justify-end gap-2 border-t p-4">
        <Button
          variant="outline"
          disabled={state.loading || !state.hasPrevious}
          onClick={state.previous}
        >
          {t('previous')}
        </Button>
        <Button
          variant="outline"
          disabled={state.loading || state.page?.nextOffset == null}
          onClick={state.next}
        >
          {t('next')}
        </Button>
      </div>
    </section>
  )
}
