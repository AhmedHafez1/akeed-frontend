'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akButton, notify } from '@/shared/ui'
import {
  useChangeRequestPanel,
  type ChangeRequestFeedback,
} from '@/features/dashboard/domain/useChangeRequestPanel'
import type { ChangeRequestSummary } from '@/features/dashboard/model/dashboard.model'
import { CancelOrderDialog } from './CancelOrderDialog'

function announce(feedback: ChangeRequestFeedback | null) {
  if (!feedback) return
  const options = { message: feedback.text, id: 'change-request-action' }
  if (feedback.tone === 'critical') notify.error(options)
  else notify.success(options)
}

/**
 * The top of an order's details while its customer's change request is open:
 * the request heading, contact tools outside Akeed and the three outcomes.
 * Confirming is one tap; cancelling asks first.
 */
export function ChangeRequestPanel({
  verificationId,
  orderLabel,
  summary,
  phone,
  timeZone,
  canAct,
}: {
  verificationId: string
  orderLabel: string
  summary: ChangeRequestSummary
  phone: string | null
  timeZone: string
  canAct: boolean
}) {
  const t = useTranslations('dashboard.changeRequest')
  const { locale } = useLocaleInfo()
  const panel = useChangeRequestPanel({
    verificationId,
    summary,
    phone,
    timeZone,
    canAct,
  })
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const { copy } = useCopyToClipboard(() =>
    notify.error({ message: t('copyError'), id: 'change-request-copy' })
  )
  const { resend, contact } = panel
  const failed = resend.kind === 'failed'
  const titleId = `change-request-${verificationId}`

  return (
    <section
      aria-labelledby={titleId}
      className="border-ak-warning-line overflow-hidden rounded-xl border"
    >
      <div className="bg-ak-warning-soft px-4 py-3.5">
        <h3
          id={titleId}
          className="text-ak-danger text-[0.9375rem] leading-6 font-semibold"
        >
          {t('panelTitle')}
        </h3>
      </div>

      <div className="bg-card divide-line divide-y">
        <div className="space-y-2.5 px-4 py-3.5">
          <h4 className="text-ak-body text-ink font-semibold">
            {t('contactHeading')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {contact ? (
              <>
                <a
                  href={contact.whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={akButton({ variant: 'secondary', size: 'row' })}
                >
                  <MessageCircle aria-hidden="true" />
                  {t('openWhatsapp')}
                </a>
                <a
                  href={contact.callUrl}
                  className={akButton({ variant: 'secondary', size: 'row' })}
                >
                  <Phone aria-hidden="true" />
                  {t('call')}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    void copy(contact.copyText).then((copied) => {
                      if (copied)
                        notify.success({
                          message: t('copied'),
                          id: 'change-request-copy',
                        })
                    })
                  }
                  className={akButton({ variant: 'secondary', size: 'row' })}
                >
                  <Copy aria-hidden="true" />
                  {t('copy')}
                </button>
              </>
            ) : (
              (['openWhatsapp', 'call', 'copy'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled
                  className={akButton({ variant: 'secondary', size: 'row' })}
                >
                  {key === 'openWhatsapp' ? (
                    <MessageCircle aria-hidden="true" />
                  ) : key === 'call' ? (
                    <Phone aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  {t(key)}
                </button>
              ))
            )}
          </div>
          {!contact && (
            <p className="text-ak-caption text-ak-warning">{t('noPhone')}</p>
          )}
        </div>

        {canAct && (
          <div className="space-y-2.5 px-4 py-3.5">
            <h4 className="text-ak-body text-ink font-semibold">
              {t('resultHeading')}
            </h4>
            <button
              type="button"
              disabled={panel.disabled.confirm}
              aria-busy={panel.pending === 'confirm'}
              onClick={() => void panel.run('confirm').then(announce)}
              className={cn(
                akButton({ variant: 'primary', size: 'md' }),
                'w-full'
              )}
            >
              {panel.pending === 'confirm' ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Check aria-hidden="true" strokeWidth={2.5} />
              )}
              {t('confirmAfter')}
            </button>
            <button
              type="button"
              disabled={panel.disabled.resend}
              aria-busy={panel.pending === 'resend'}
              onClick={() => void panel.run('resend').then(announce)}
              className={cn(
                akButton({ variant: 'secondary', size: 'md' }),
                'w-full'
              )}
            >
              <RefreshCw aria-hidden="true" />
              {t('resend')}
            </button>
            {panel.resendText && (
              <div
                role={failed ? 'alert' : 'status'}
                className={cn(
                  'rounded-ak-control flex items-start gap-2 border px-3 py-2.5',
                  failed
                    ? 'bg-ak-danger-soft text-ak-danger border-destructive-border'
                    : resend.kind === 'queued'
                      ? 'bg-ak-info-soft text-ak-info border-info-border'
                      : 'bg-neutral-soft text-ink border-line'
                )}
              >
                {failed ? (
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                ) : resend.kind === 'queued' ? (
                  <Loader2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Clock
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-ak-caption font-medium">
                    {panel.resendText}
                  </p>
                  {failed && resend.retryable && (
                    <div className="flex flex-wrap gap-2">
                      {resend.reason === 'balance' && (
                        <Link
                          href={withLocale('/billing', locale)}
                          className={akButton({
                            variant: 'secondary',
                            size: 'table',
                          })}
                        >
                          {t('topUp')}
                        </Link>
                      )}
                      <button
                        type="button"
                        disabled={panel.disabled.resend}
                        onClick={() => void panel.run('resend').then(announce)}
                        className={akButton({
                          variant: 'secondary',
                          size: 'table',
                        })}
                      >
                        <RefreshCw aria-hidden="true" />
                        {t('retry')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="border-line border-t pt-2.5">
              <button
                type="button"
                disabled={panel.disabled.cancel}
                onClick={() => setConfirmingCancel(true)}
                className={cn(
                  akButton({ variant: 'secondary', size: 'md' }),
                  'text-ak-danger border-destructive-border hover:bg-ak-danger-soft w-full'
                )}
              >
                <XCircle aria-hidden="true" />
                {t('cancelAfter')}
              </button>
            </div>
          </div>
        )}
      </div>

      <CancelOrderDialog
        orderLabel={confirmingCancel ? orderLabel : null}
        isCanceling={panel.pending === 'cancel'}
        onConfirm={() =>
          void panel.run('cancel').then((feedback) => {
            setConfirmingCancel(false)
            announce(feedback)
          })
        }
        onDismiss={() => setConfirmingCancel(false)}
      />
    </section>
  )
}
