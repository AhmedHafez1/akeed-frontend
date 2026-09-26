'use client'

import { History } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import { cancellationMessageKey } from '@/features/dashboard/domain/cancellation'
import { getVerificationLifecycleSteps } from '@/features/dashboard/domain/verificationLifecycle'
import {
  formatOrderTitle,
  formatOrderTotal,
  formatTooltipDateTime,
  resolveRowDescriptionKey,
} from '@/features/dashboard/domain/verificationRow'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

/**
 * Everything recorded about one order, opened from the row's menu: who, how
 * much, each step of the conversation with its time, and why cancelling is
 * not offered when it is not. Read-only — the actions live on the row.
 */
export function VerificationDetailsSheet({
  verification,
  timeZone,
  onClose,
}: {
  verification: VerificationItem | null
  timeZone: string
  onClose: () => void
}) {
  const t = useTranslations('dashboard')

  return (
    <Dialog
      open={verification !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      {verification && (
        <DialogContent
          closeLabel={t('table.actions.dismiss')}
          className="!inset-y-0 [inset-inline-end:0] !top-0 !left-auto !h-dvh !w-[calc(100vw-1.5rem)] !max-w-none !translate-x-0 !translate-y-0 !overflow-y-auto !rounded-none !border-y-0 !p-0 sm:!w-[min(100vw,520px)]"
        >
          <DetailsBody verification={verification} timeZone={timeZone} />
        </DialogContent>
      )}
    </Dialog>
  )
}

function DetailsBody({
  verification,
  timeZone,
}: {
  verification: VerificationItem
  timeZone: string
}) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const unavailableKey = cancellationMessageKey(verification)

  return (
    <>
      <DialogHeader className="border-border border-b px-5 py-5 pe-14">
        <DialogTitle className="text-xl">
          <bdi dir="ltr">
            {formatOrderTitle(verification, t('table.orderFallbackPrefix'))}
          </bdi>
        </DialogTitle>
        <DialogDescription>
          {t(resolveRowDescriptionKey(verification))}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 p-5">
        <div className="bg-muted grid grid-cols-2 gap-4 rounded-xl p-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">
              {t('table.headings.customer')}
            </p>
            <p className="text-foreground mt-1 font-semibold">
              {verification.customer_name || t('table.unknownCustomer')}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              <bdi dir="ltr">
                {verification.customer_phone || t('table.noPhone')}
              </bdi>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              {t('table.headings.total')}
            </p>
            <p className="text-foreground mt-1 font-semibold">
              <bdi dir="ltr">{formatOrderTotal(verification, locale)}</bdi>
            </p>
          </div>
        </div>

        <section aria-labelledby="verification-history-title">
          <h3
            id="verification-history-title"
            className="text-foreground flex items-center gap-2 font-semibold"
          >
            <History aria-hidden="true" className="size-4" />
            {t('table.lifecycle.label')}
          </h3>
          <ol className="mt-3 space-y-3">
            {getVerificationLifecycleSteps(verification).map((step) => {
              const stateKey = step.completedByOutcome
                ? `table.lifecycle.completedBy.${step.completedByOutcome}`
                : step.recorded
                  ? 'table.lifecycle.recorded'
                  : 'table.lifecycle.unrecorded'
              return (
                <li key={step.id} className="flex items-start gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-2.5 shrink-0 rounded-full border',
                      step.recorded
                        ? 'bg-primary border-primary'
                        : 'border-input bg-card'
                    )}
                  />
                  <div>
                    <p className="text-foreground font-medium">
                      {t(`table.lifecycle.${step.label}`)}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {t(stateKey)}
                      {step.timestamp
                        ? ` · ${formatTooltipDateTime(
                            step.timestamp,
                            locale,
                            timeZone
                          )}`
                        : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <dl className="divide-border border-border divide-y rounded-xl border px-4 text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted-foreground">
              {t('table.headings.followUp')}
            </dt>
            <dd className="text-foreground text-end font-medium">
              {verification.follow_up_sent_at
                ? `${t('table.followUp.sent')} · ${formatTooltipDateTime(
                    verification.follow_up_sent_at,
                    locale,
                    timeZone
                  )}`
                : t('table.followUp.notSent')}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted-foreground">
              {t('table.headings.created')}
            </dt>
            <dd className="text-foreground text-end font-medium">
              {formatTooltipDateTime(verification.created_at, locale, timeZone)}
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-muted-foreground">{t('table.technicalId')}</dt>
            <dd className="text-foreground/80 mt-1 font-mono text-xs break-all">
              {verification.order_id}
            </dd>
          </div>
        </dl>

        {unavailableKey && (
          <p className="text-muted-foreground text-xs leading-5">
            {t(`table.actions.${unavailableKey}`)}
          </p>
        )}
      </div>
    </>
  )
}
