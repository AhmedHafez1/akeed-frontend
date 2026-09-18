'use client'

import { useRef, useState } from 'react'
import { Ellipsis, Eye, History, RotateCcw, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { VerificationItem } from '../../model/dashboard.model'
import {
  canCancelOrder,
  cancellationMessageKey,
} from '../../domain/cancellation'
import {
  canRetryVerification,
  getVerificationLifecycleSteps,
  hasCapability,
} from '../../domain/verificationLifecycle'
import { VerificationStatusBadge } from './components/VerificationStatusBadge'
import {
  formatCreatedDate,
  formatCreatedTime,
  formatCurrencyTotal,
  formatOrderTitle,
  formatTooltipDateTime,
  resolveRowDescriptionKey,
} from '../../domain/verificationRow'

interface VerificationsTableStandaloneProps {
  verifications: VerificationItem[]
  reportingTimezone: string
  actingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  actionErrors: Record<string, string>
  canCancelOrders: boolean
  canRetryVerifications: boolean
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
  onRetryVerification: (verificationId: string) => Promise<void>
}

export function VerificationsTableStandalone(
  props: VerificationsTableStandaloneProps
) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const detailsTriggerRef = useRef<HTMLButtonElement | null>(null)
  const selected =
    props.verifications.find(
      (verification) => verification.id === selectedId
    ) ?? null

  const closeDetails = () => {
    if (selectedId) props.onDismissCancelOrder(selectedId)
    setSelectedId(null)
  }

  const openDetails = (
    verificationId: string,
    trigger: HTMLButtonElement | null
  ) => {
    detailsTriggerRef.current = trigger
    setSelectedId(verificationId)
  }

  const requestCancel = (
    verificationId: string,
    trigger: HTMLButtonElement | null
  ) => {
    detailsTriggerRef.current = trigger
    setSelectedId(verificationId)
    props.onRequestCancelOrder(verificationId)
  }

  return (
    <>
      <table className="hidden w-full table-fixed text-start text-sm md:table">
        <caption className="sr-only">{t('verifications.title')}</caption>
        <thead>
          {/*
           * The header pins to the top of the scroll container the section
           * wraps this table in, so the background has to be opaque -- rows
           * would otherwise show through the translucent one this row used to
           * carry. The bottom rule moved onto the cells with it.
           */}
          <tr className="text-foreground/70 text-xs font-medium">
            {[
              ['order', 'w-[17%]'],
              ['customer', 'w-[25%]'],
              ['status', 'w-[18%]'],
              ['total', 'w-[15%]'],
              ['created', 'w-[17%]'],
              ['actions', 'w-[8%]'],
            ].map(([heading, width]) => (
              <th
                key={heading}
                scope="col"
                className={cn(
                  'bg-muted/50 sticky top-0 z-10 px-4 py-3 text-start',
                  // The bottom rule is drawn by a pseudo-element rather than a
                  // border: under `border-collapse`, a border on a sticky cell
                  // is dropped by WebKit while the container scrolls.
                  "after:bg-border after:absolute after:inset-x-0 after:bottom-0 after:h-px after:content-['']",
                  width
                )}
              >
                {t(`table.headings.${heading}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border bg-card divide-y">
          {props.verifications.map((verification) => (
            <tr
              key={verification.id}
              aria-busy={verification.optimistic ? true : undefined}
              className={cn(
                'hover:bg-muted/70 text-foreground/80 transition-colors',
                verification.optimistic && 'bg-muted/60'
              )}
            >
              <td className="min-w-0 px-4 py-3">
                <p className="text-foreground truncate font-semibold">
                  <bdi>
                    {formatOrderTitle(
                      verification,
                      t('table.orderFallbackPrefix')
                    )}
                  </bdi>
                </p>
                {verification.is_test && (
                  <span className="bg-info-subtle text-info-subtle-foreground mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold">
                    {t('table.testBadge')}
                  </span>
                )}
              </td>
              <td className="min-w-0 px-4 py-3">
                <p className="text-foreground truncate font-medium">
                  {verification.customer_name || t('table.unknownCustomer')}
                </p>
                <p className="text-foreground/70 mt-0.5 truncate text-xs">
                  {verification.customer_phone ? (
                    <bdi dir="ltr">{verification.customer_phone}</bdi>
                  ) : (
                    t('table.noPhone')
                  )}
                </p>
              </td>
              <td className="px-4 py-3">
                <VerificationStatusBadge verification={verification} />
              </td>
              <td className="text-foreground px-4 py-3 font-medium">
                <bdi>{formatCurrencyTotal(verification, locale)}</bdi>
              </td>
              <td className="text-foreground/70 px-4 py-3 text-xs">
                {formatCreatedDate(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}{' '}
                {formatCreatedTime(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {!verification.optimistic && (
                  <VerificationActionsMenu
                    {...props}
                    verification={verification}
                    onOpenDetails={openDetails}
                    onOpenCancel={requestCancel}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="bg-muted/40 grid gap-3 p-3 md:hidden">
        {props.verifications.map((verification) => (
          <li
            key={verification.id}
            aria-busy={verification.optimistic ? true : undefined}
            className="rounded-card border-border bg-card border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-foreground truncate font-bold">
                  {formatOrderTitle(
                    verification,
                    t('table.orderFallbackPrefix')
                  )}
                </p>
                <VerificationStatusBadge
                  verification={verification}
                  className="mt-2"
                />
              </div>
              <p className="text-foreground shrink-0 text-sm font-bold">
                <bdi>{formatCurrencyTotal(verification, locale)}</bdi>
              </p>
            </div>
            <div className="border-border mt-3 border-t pt-3">
              <p className="text-foreground truncate text-sm font-medium">
                {verification.customer_name || t('table.unknownCustomer')}
              </p>
              <p className="text-foreground/70 mt-0.5 text-xs">
                {verification.customer_phone ? (
                  <bdi dir="ltr">{verification.customer_phone}</bdi>
                ) : (
                  t('table.noPhone')
                )}
              </p>
            </div>
            <div className="text-foreground/70 mt-3 flex items-center justify-between gap-3 text-xs">
              <span>
                {formatCreatedDate(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}{' '}
                {formatCreatedTime(
                  verification.created_at,
                  locale,
                  props.reportingTimezone
                )}
              </span>
              {!verification.optimistic && (
                <VerificationActionsMenu
                  {...props}
                  verification={verification}
                  onOpenDetails={openDetails}
                  onOpenCancel={requestCancel}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && closeDetails()}
      >
        {selected && (
          <VerificationDetails
            {...props}
            verification={selected}
            getReturnFocusTarget={() => detailsTriggerRef.current}
          />
        )}
      </Dialog>
    </>
  )
}

interface VerificationActionsMenuProps extends Omit<
  VerificationsTableStandaloneProps,
  'verifications'
> {
  verification: VerificationItem
  onOpenDetails: (
    verificationId: string,
    trigger: HTMLButtonElement | null
  ) => void
  onOpenCancel: (
    verificationId: string,
    trigger: HTMLButtonElement | null
  ) => void
}

function VerificationActionsMenu({
  verification,
  onOpenDetails,
  onOpenCancel,
  ...props
}: VerificationActionsMenuProps) {
  const t = useTranslations('dashboard')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const showRetry =
    props.canRetryVerifications &&
    canRetryVerification(verification.capabilities)
  const showCancel =
    props.canCancelOrders &&
    hasCapability(
      verification.capabilities,
      'merchant_no_reply_cancellation'
    ) &&
    canCancelOrder(verification)
  const isAnyActionRunning = props.actingVerificationId !== null
  const orderTitle = formatOrderTitle(
    verification,
    t('table.orderFallbackPrefix')
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={t('table.actions.openMenu', { order: orderTitle })}
          className="text-foreground/70 hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          <Ellipsis aria-hidden="true" className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => onOpenDetails(verification.id, triggerRef.current)}
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          {t('table.actions.details')}
        </DropdownMenuItem>
        {showRetry && (
          <DropdownMenuItem
            disabled={isAnyActionRunning}
            onSelect={() => void props.onRetryVerification(verification.id)}
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {props.actingVerificationId === verification.id
              ? t('table.actions.retrying')
              : t('table.actions.retry')}
          </DropdownMenuItem>
        )}
        {showCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              disabled={isAnyActionRunning}
              onSelect={() => onOpenCancel(verification.id, triggerRef.current)}
            >
              <XCircle aria-hidden="true" className="h-4 w-4" />
              {t('table.actions.cancelOrder')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface VerificationDetailsProps extends Omit<
  VerificationsTableStandaloneProps,
  'verifications'
> {
  verification: VerificationItem
  getReturnFocusTarget: () => HTMLButtonElement | null
}

function VerificationDetails(props: VerificationDetailsProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const { verification } = props
  const isActing = props.actingVerificationId === verification.id
  const isConfirming = props.confirmingCancelVerificationId === verification.id
  const showRetry =
    props.canRetryVerifications &&
    canRetryVerification(verification.capabilities)
  const showCancel =
    props.canCancelOrders &&
    hasCapability(
      verification.capabilities,
      'merchant_no_reply_cancellation'
    ) &&
    canCancelOrder(verification)
  const unavailableKey = cancellationMessageKey(verification)

  return (
    <DialogContent
      closeLabel={t('table.actions.dismiss')}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        props.getReturnFocusTarget()?.focus()
      }}
      className="!inset-y-0 [inset-inline-end:0] !top-0 !left-auto !h-dvh !w-[calc(100vw-1.5rem)] !max-w-none !translate-x-0 !translate-y-0 !overflow-y-auto !rounded-none !border-y-0 !p-0 sm:!w-[min(100vw,520px)]"
    >
      <DialogHeader className="border-border border-b px-5 py-5 pe-14">
        <DialogTitle className="text-xl">
          {formatOrderTitle(verification, t('table.orderFallbackPrefix'))}
        </DialogTitle>
        <DialogDescription>
          {t(resolveRowDescriptionKey(verification))}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 p-5">
        <div className="bg-muted grid grid-cols-2 gap-4 rounded-xl p-4 text-sm">
          <div>
            <p className="text-foreground/70 text-xs">
              {t('table.headings.customer')}
            </p>
            <p className="text-foreground mt-1 font-semibold">
              {verification.customer_name || t('table.unknownCustomer')}
            </p>
            <p className="text-foreground/70 mt-0.5 text-xs">
              <bdi dir="ltr">
                {verification.customer_phone || t('table.noPhone')}
              </bdi>
            </p>
          </div>
          <div>
            <p className="text-foreground/70 text-xs">
              {t('table.headings.total')}
            </p>
            <p className="text-foreground mt-1 font-semibold">
              <bdi>{formatCurrencyTotal(verification, locale)}</bdi>
            </p>
          </div>
        </div>

        <section aria-labelledby="verification-history-title">
          <h3
            id="verification-history-title"
            className="text-foreground flex items-center gap-2 font-semibold"
          >
            <History aria-hidden="true" className="h-4 w-4" />
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
                      'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border',
                      step.recorded
                        ? 'bg-primary border-primary'
                        : 'border-input bg-card'
                    )}
                  />
                  <div>
                    <p className="text-foreground font-medium">
                      {t(`table.lifecycle.${step.label}`)}
                    </p>
                    <p className="text-foreground/70 mt-0.5 text-xs">
                      {t(stateKey)}
                      {step.timestamp
                        ? ` · ${formatTooltipDateTime(
                            step.timestamp,
                            locale,
                            props.reportingTimezone
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
            <dt className="text-foreground/70">
              {t('table.headings.followUp')}
            </dt>
            <dd className="text-foreground text-end font-medium">
              {verification.follow_up_sent_at
                ? `${t('table.followUp.sent')} · ${formatTooltipDateTime(
                    verification.follow_up_sent_at,
                    locale,
                    props.reportingTimezone
                  )}`
                : t('table.followUp.notSent')}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-foreground/70">
              {t('table.headings.created')}
            </dt>
            <dd className="text-foreground text-end font-medium">
              {formatTooltipDateTime(
                verification.created_at,
                locale,
                props.reportingTimezone
              )}
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-foreground/70">{t('table.technicalId')}</dt>
            <dd className="text-foreground/80 mt-1 font-mono text-xs break-all">
              {verification.order_id}
            </dd>
          </div>
        </dl>

        {(showRetry || showCancel || unavailableKey) && (
          <section aria-labelledby="verification-actions-title">
            <h3
              id="verification-actions-title"
              className="text-foreground font-semibold"
            >
              {t('table.headings.actions')}
            </h3>
            {isConfirming && showCancel ? (
              <div className="border-destructive-border bg-destructive-subtle mt-3 rounded-xl border p-4">
                <p className="text-destructive-subtle-foreground text-sm leading-6">
                  {t('table.actions.cancelOrderConfirmDescription')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() =>
                      void props.onConfirmCancelOrder(verification.id)
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    {isActing
                      ? t('table.actions.cancelingOrder')
                      : t('table.actions.confirmCancelOrder')}
                  </button>
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() => props.onDismissCancelOrder(verification.id)}
                    className="border-destructive-border bg-card text-foreground/80 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    {t('table.actions.keepOrder')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {showRetry && (
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() =>
                      void props.onRetryVerification(verification.id)
                    }
                    className="border-warning-border bg-warning-subtle text-warning-subtle-foreground hover:bg-warning-subtle rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    {isActing
                      ? t('table.actions.retrying')
                      : t('table.actions.retry')}
                  </button>
                )}
                {showCancel && (
                  <button
                    type="button"
                    disabled={props.actingVerificationId !== null}
                    onClick={() => props.onRequestCancelOrder(verification.id)}
                    className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground hover:bg-destructive-subtle rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    {t('table.actions.cancelOrder')}
                  </button>
                )}
              </div>
            )}
            {unavailableKey && (
              <p className="text-foreground/70 mt-3 text-xs leading-5">
                {t(`table.actions.${unavailableKey}`)}
              </p>
            )}
            {props.actionErrors[verification.id] && (
              <p
                role="alert"
                className="text-destructive-subtle-foreground mt-3 text-sm"
              >
                {props.actionErrors[verification.id]}
              </p>
            )}
          </section>
        )}
      </div>
    </DialogContent>
  )
}
