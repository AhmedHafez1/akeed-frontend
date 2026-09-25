'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Moon } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { billingPurchaseHref } from '@/features/billing'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import { withLocale } from '@/shared/lib/locale'
import { Badge, Button, LoadingButton, Progress } from '@/shared/ui'
import {
  useResumeOrderImport,
  useStopOrderImport,
} from '../../api/orderImportMutations'
import {
  isOrderImportApiError,
  type OrderImportBatchDetail,
  type OrderImportLifecycleCounts,
  type OrderImportStartBlocker,
} from '../../api/orderImportsApi'
import { importOrdersPath } from '../../domain/importRoutes'
import {
  importReturnPath,
  isSettling,
  isWaitingOutQuietHours,
  minutesLeft,
  releaseProgress,
  splitDuration,
  type ReleaseProgress,
} from '../../domain/releaseSummary'
import { useReleaseOutcomeSync } from '../../domain/useReleaseOutcomeSync'
import { IMPORT_STEP_HEADING_ID } from './ImportWizardShell'
import { ImportNotice } from './ImportNotice'
import { StopImportDialog } from './StopImportDialog'
import { useBlockerText } from './useBlockerText'

/** M8 pills, in order, with the badge tone the lifecycle uses elsewhere. */
const pills: ReadonlyArray<{
  key: keyof OrderImportLifecycleCounts
  variant: 'neutral' | 'info' | 'success' | 'danger' | 'warning'
}> = [
  { key: 'queued', variant: 'neutral' },
  { key: 'sent', variant: 'info' },
  { key: 'confirmed', variant: 'success' },
  { key: 'canceled', variant: 'danger' },
  { key: 'noReply', variant: 'warning' },
  { key: 'failed', variant: 'danger' },
]

/**
 * M8: a started import. Progress and live counts while it releases, the
 * reason and the way out while it is paused, and the final tally once it is
 * stopped or finished. The page polls every 5 seconds while anything moves.
 */
export function ReleaseView({
  detail,
  canEdit,
}: {
  detail: OrderImportBatchDetail
  canEdit: boolean
}) {
  const t = useTranslations('orderImport.release')
  const tImport = useTranslations('orderImport')
  const locale = useLocale()
  const format = useFormatter()
  const progress = releaseProgress(detail)
  useReleaseOutcomeSync(detail)
  const lifecycle = detail.lifecycle
  const stop = useStopOrderImport(detail.batchId)
  const [stopOpen, setStopOpen] = useState(false)
  const active = detail.status === 'releasing' || detail.status === 'paused'
  const { hours, minutes } = splitDuration(minutesLeft(detail))
  const timeLeft =
    hours > 0
      ? tImport('start.durationHours', { hours, minutes })
      : tImport('start.durationMinutes', { minutes })

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2
          id={IMPORT_STEP_HEADING_ID}
          tabIndex={-1}
          className="text-h3 text-foreground font-semibold focus:outline-none"
        >
          <bdi>{detail.fileName}</bdi>
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          {tImport(`batchStatus.${detail.status}`)}
          {detail.startedAt && (
            <>
              {' · '}
              {t('startedAt', {
                time: format.dateTime(new Date(detail.startedAt), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              })}
            </>
          )}
        </p>
      </header>

      <StatusBanner detail={detail} progress={progress} canEdit={canEdit} />

      <div className="rounded-card border-border bg-card space-y-3 border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-foreground text-sm font-semibold">
            {t('progress', {
              settled: progress.settled,
              total: progress.total,
            })}
            {detail.status === 'releasing' && progress.held > 0 && (
              <span className="text-muted-foreground font-normal">
                {' · '}
                {t('timeLeft', { duration: timeLeft })}
              </span>
            )}
          </p>
          {active && detail.ratePerMinute !== undefined && (
            <p className="text-muted-foreground text-xs">
              {t('rate', { rate: detail.ratePerMinute })}
            </p>
          )}
        </div>
        <Progress
          value={progress.percent}
          aria-label={t('progress', {
            settled: progress.settled,
            total: progress.total,
          })}
        />
      </div>

      {lifecycle && (
        <ul className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <li key={pill.key}>
              <Badge variant={pill.variant} className="gap-1.5 px-3 py-1">
                <span>{t(`pills.${pill.key}`)}</span>
                <bdi className="font-semibold tabular-nums">
                  {lifecycle[pill.key].toLocaleString(locale)}
                </bdi>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="outline">
          <Link href={withLocale(importOrdersPath(detail.batchId), locale)}>
            {tImport('imported.reviewOrders')}
          </Link>
        </Button>
        {active && canEdit && (
          <Button
            type="button"
            variant="outline"
            className="border-destructive-border text-destructive hover:bg-destructive-subtle hover:text-destructive-subtle-foreground"
            onClick={() => {
              stop.reset()
              setStopOpen(true)
            }}
          >
            {t('stop')}
          </Button>
        )}
      </div>

      <StopImportDialog
        open={stopOpen}
        pending={stop.isPending}
        failed={stop.isError}
        remaining={progress.held}
        onOpenChange={setStopOpen}
        onConfirm={() =>
          stop.mutate(undefined, { onSuccess: () => setStopOpen(false) })
        }
      />
    </section>
  )
}

/** The one banner that explains the batch's state and offers the way out. */
function StatusBanner({
  detail,
  progress,
  canEdit,
}: {
  detail: OrderImportBatchDetail
  progress: ReleaseProgress
  canEdit: boolean
}) {
  const t = useTranslations('orderImport.release')
  const tStart = useTranslations('orderImport.start')
  const tCredits = useTranslations('creditErrors')
  const locale = useLocale()
  const format = useFormatter()
  const blockerText = useBlockerText()
  const resume = useResumeOrderImport(detail.batchId)
  const release = detail.release

  // Handed over is not sent: until every send has an outcome, say so.
  if (isSettling(detail))
    return (
      <ImportNotice tone="info" role="status">
        {t('settling', { count: progress.queued })}
      </ImportNotice>
    )

  if (detail.status === 'stopped' || detail.status === 'completed')
    return (
      <div className="space-y-3">
        {detail.status === 'stopped' ? (
          <ImportNotice tone="neutral" role="status">
            {t('stopped', {
              sent: progress.delivered,
              withdrawn: release?.withdrawn ?? 0,
            })}
          </ImportNotice>
        ) : (
          progress.delivered > 0 && (
            <ImportNotice tone="success" role="status">
              {t('completed', { count: progress.delivered })}
            </ImportNotice>
          )
        )}
        {progress.failed > 0 && (
          <ImportNotice tone="critical" role="alert">
            {t('failedSome', { count: progress.failed })}
          </ImportNotice>
        )}
      </div>
    )

  if (isWaitingOutQuietHours(detail))
    return (
      <ImportNotice tone="info" role="status">
        <span className="inline-flex items-start gap-2">
          <Moon aria-hidden="true" className="mt-1 size-4 shrink-0" />
          <span>
            {t('quietHours', {
              time: format.dateTime(new Date(detail.quietHoursUntil!), {
                timeStyle: 'short',
                timeZone: detail.storeTimezone ?? undefined,
              }),
              timezone: detail.storeTimezone ?? '',
            })}
          </span>
        </span>
      </ImportNotice>
    )

  if (detail.status !== 'paused') return null

  const reason = detail.pausedReason ?? ''
  if (reason === 'staff_paused')
    return (
      <ImportNotice tone="warning" role="alert">
        {t('staffPaused')}
      </ImportNotice>
    )

  const creditKey = creditFeedbackKey(reason)
  const reasonText = creditKey
    ? tCredits(creditKey)
    : t.has(`pausedReason.${reason}`)
      ? t(`pausedReason.${reason}`)
      : t('pausedReason.other')
  const resumeBlockers: OrderImportStartBlocker[] =
    resume.error && isOrderImportApiError(resume.error)
      ? (resume.error.blockers ?? [])
      : []

  return (
    <div className="space-y-3">
      <ImportNotice
        tone="warning"
        role="alert"
        title={t('pausedTitle', { reason: reasonText })}
        actions={
          canEdit && (
            <>
              {creditKey && (
                <Button asChild size="sm">
                  <Link
                    href={withLocale(
                      billingPurchaseHref({
                        credits: release?.held ?? 0,
                        returnTo: importReturnPath(detail.batchId, false),
                      }),
                      locale
                    )}
                  >
                    {t('buyCredits')}
                  </Link>
                </Button>
              )}
              {reason === 'IMPORT_AUTO_VERIFY_DISABLED' && (
                <Button asChild size="sm">
                  <Link
                    href={`${withLocale('/settings', locale)}#automation-settings`}
                  >
                    {tStart('openSettings')}
                  </Link>
                </Button>
              )}
              <LoadingButton
                type="button"
                size="sm"
                variant="outline"
                loading={resume.isPending}
                onClick={() => resume.mutate()}
              >
                {t('resume')}
              </LoadingButton>
            </>
          )
        }
      >
        {t('waiting', { count: release?.held ?? 0 })}
      </ImportNotice>
      {resume.isError && (
        <ImportNotice tone="critical" role="alert" title={t('resumeFailed')}>
          {resumeBlockers.length > 0
            ? resumeBlockers.map((blocker) => (
                <span key={blocker.code} className="block">
                  {blockerText(blocker)}
                </span>
              ))
            : null}
        </ImportNotice>
      )}
    </div>
  )
}
