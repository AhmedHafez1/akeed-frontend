'use client'

import { useId, type ReactNode } from 'react'
import Link from 'next/link'
import { Clock, Coins, Users, Wallet, type LucideIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { billingPurchaseHref } from '@/features/billing'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  LoadingButton,
  LoadingSpinner,
} from '@/shared/ui'
import type { OrderImportStartQuote } from '../../api/orderImportsApi'
import {
  balanceAfterFirstMessages,
  importReturnPath,
  shortfallOf,
  splitDuration,
} from '../../domain/releaseSummary'
import { useStartConfirmation } from '../../domain/useStartConfirmation'
import { ImportNotice } from './ImportNotice'
import { useBlockerText } from './useBlockerText'

interface StartConfirmationDialogProps {
  batchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * M7: the deliberate checkpoint before an import contacts anyone. The merchant
 * sees the count, pace, cost and balance, ticks the consent statement, and
 * only then can start. A shortfall turns the start into Buy credits.
 */
export function StartConfirmationDialog({
  batchId,
  open,
  onOpenChange,
}: StartConfirmationDialogProps) {
  const t = useTranslations('orderImport.start')
  const locale = useLocale()
  const confirmation = useStartConfirmation(batchId, open)
  const { quote } = confirmation
  const shortfall = quote.data ? shortfallOf(quote.data) : undefined
  const purchaseCredits = shortfall?.suggestedPurchaseCredits

  const close = (next: boolean) => {
    if (confirmation.isStarting) return
    if (!next) confirmation.reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        closeLabel={t('cancel')}
        closeDisabled={confirmation.isStarting}
        className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-[35rem] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {quote.isPending ? (
          <div
            role="status"
            className="text-muted-foreground flex items-center gap-3 py-8 text-sm"
          >
            <LoadingSpinner />
            {t('loading')}
          </div>
        ) : quote.isError ? (
          <ImportNotice
            tone="critical"
            role="alert"
            title={t('loadFailed')}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void quote.refetch()}
              >
                {t('retry')}
              </Button>
            }
          />
        ) : (
          <QuoteBody
            quote={quote.data}
            agreed={confirmation.agreed}
            onAgreedChange={confirmation.setAgreed}
            notice={confirmation.notice}
            locale={locale}
          />
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={confirmation.isStarting}
            onClick={() => close(false)}
          >
            {t('cancel')}
          </Button>
          {purchaseCredits ? (
            <Button asChild>
              <Link
                href={withLocale(
                  billingPurchaseHref({
                    credits: purchaseCredits,
                    returnTo: importReturnPath(batchId, true),
                  }),
                  locale
                )}
              >
                {t('buy', { credits: purchaseCredits })}
              </Link>
            </Button>
          ) : (
            <LoadingButton
              type="button"
              loading={confirmation.isStarting}
              disabled={!confirmation.canStart}
              onClick={() =>
                confirmation.submit(() => {
                  confirmation.reset()
                  onOpenChange(false)
                })
              }
            >
              {t('confirm', { count: quote.data?.orders ?? 0 })}
            </LoadingButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuoteBody({
  quote,
  agreed,
  onAgreedChange,
  notice,
  locale,
}: {
  quote: OrderImportStartQuote
  agreed: boolean
  onAgreedChange: (agreed: boolean) => void
  notice: 'stale' | 'failed' | null
  locale: string
}) {
  const t = useTranslations('orderImport.start')
  const blockerText = useBlockerText()
  const checkboxId = useId()
  const shortfall = shortfallOf(quote)
  const after = balanceAfterFirstMessages(quote)
  const { hours, minutes } = splitDuration(quote.estimatedDurationMinutes)
  const duration =
    hours > 0
      ? t('durationHours', { hours, minutes })
      : t('durationMinutes', { minutes })
  const autoVerifyOff = quote.blockers.some(
    (blocker) => blocker.code === 'IMPORT_AUTO_VERIFY_DISABLED'
  )
  const otherBlockers = quote.blockers.filter(
    (blocker) =>
      blocker !== shortfall && blocker.code !== 'IMPORT_AUTO_VERIFY_DISABLED'
  )
  const attestation =
    locale === 'ar' ? quote.attestation.text.ar : quote.attestation.text.en

  return (
    <div className="space-y-4">
      {notice === 'stale' && (
        <ImportNotice tone="warning" role="alert">
          {t('stale')}
        </ImportNotice>
      )}
      {notice === 'failed' && (
        <ImportNotice tone="critical" role="alert">
          {t('failed')}
        </ImportNotice>
      )}
      {autoVerifyOff && (
        <ImportNotice
          tone="info"
          role="alert"
          title={t('autoVerifyTitle')}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link
                href={`${withLocale('/settings', locale)}#automation-settings`}
              >
                {t('openSettings')}
              </Link>
            </Button>
          }
        />
      )}
      {shortfall && (
        <ImportNotice tone="warning" role="alert" title={t('shortfallTitle')}>
          {t('shortfallBody', { count: quote.orders })}
        </ImportNotice>
      )}
      {otherBlockers.map((blocker) => (
        <ImportNotice key={blocker.code} tone="critical" role="alert">
          {blockerText(blocker)}
        </ImportNotice>
      ))}

      <dl className="divide-border border-border rounded-card divide-y border">
        <SummaryRow icon={Users} label={t('customers')}>
          <bdi className="tabular-nums">
            {quote.orders.toLocaleString(locale)}
          </bdi>
        </SummaryRow>
        <SummaryRow icon={Clock} label={t('pace')}>
          {t('paceValue', { rate: quote.ratePerMinute, duration })}
          {quote.quietHours.enabled &&
            quote.quietHours.start &&
            quote.quietHours.end && (
              <span className="text-muted-foreground block text-xs leading-5">
                {t('quietNote', {
                  window: `${quote.quietHours.start}–${quote.quietHours.end}`,
                })}
              </span>
            )}
        </SummaryRow>
        {quote.accountingMode === 'prepaid_credit' ? (
          <>
            <SummaryRow icon={Coins} label={t('credits')}>
              {quote.estimatedCreditsMax > quote.estimatedCreditsMin
                ? t('creditsValue', {
                    min: quote.estimatedCreditsMin,
                    max: quote.estimatedCreditsMax,
                  })
                : t('creditsValueNoFollowUp', {
                    min: quote.estimatedCreditsMin,
                  })}
            </SummaryRow>
            <SummaryRow
              icon={Wallet}
              label={t('balance')}
              tone={shortfall ? 'critical' : undefined}
            >
              {shortfall
                ? t('balanceShort', {
                    available: Math.max(quote.creditsAvailable ?? 0, 0),
                    shortfall: shortfall.shortfall ?? 0,
                  })
                : t('balanceValue', {
                    available: quote.creditsAvailable ?? 0,
                    after: after ?? 0,
                  })}
            </SummaryRow>
          </>
        ) : (
          <SummaryRow icon={Coins} label={t('planUsage')}>
            {t('planUsageValue', {
              min: quote.estimatedCreditsMin,
              slots: quote.slotsRemaining ?? 0,
            })}
          </SummaryRow>
        )}
      </dl>

      <div className="rounded-card border-border bg-muted/40 flex items-start gap-3 border p-4">
        <input
          id={checkboxId}
          type="checkbox"
          checked={agreed}
          disabled={quote.blockers.length > 0}
          onChange={(event) => onAgreedChange(event.target.checked)}
          className="accent-primary focus-visible:ring-ring mt-1 size-4 shrink-0 rounded focus-visible:ring-2 focus-visible:outline-none"
        />
        <label
          htmlFor={checkboxId}
          className="text-foreground text-sm leading-6"
        >
          <span className="sr-only">{t('attestationLabel')}: </span>
          {attestation}
        </label>
      </div>
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: LucideIcon
  label: string
  tone?: 'critical'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4',
        tone === 'critical' &&
          'bg-destructive-subtle text-destructive-subtle-foreground'
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-5 shrink-0',
          tone === 'critical' ? 'text-current' : 'text-muted-foreground'
        )}
      />
      <div className="min-w-0 flex-1">
        <dt
          className={cn(
            'text-xs leading-5',
            tone === 'critical' ? 'text-current' : 'text-muted-foreground'
          )}
        >
          {label}
        </dt>
        <dd className="text-sm leading-6 font-medium">{children}</dd>
      </div>
    </div>
  )
}
