'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Clock, FileSpreadsheet, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { billingPurchaseHref } from '@/features/billing'
import { withLocale, type SupportedLocale } from '@/shared/lib/locale'
import { Button, LoadingButton, Progress, Skeleton } from '@/shared/ui'
import { orderImportAllRowsOptions } from '../../../api/orderImportQueries'
import type {
  OrderImportBatchDetail,
  OrderImportStartQuote,
} from '../../../api/orderImportsApi'
import { importReturnPath, shortfallOf } from '../../../domain/releaseSummary'
import { hoursLeftToStart, isCleanFile } from '../../../domain/sendSummary'
import { useSendStep, type SendOutcome } from '../../../domain/useSendStep'
import { IMPORT_STEP_HEADING_ID } from '../importHeading'
import { ImportNotice } from '../ImportNotice'
import { ModalStepLayout } from '../modal/ModalStepLayout'
import { useBlockerText } from '../useBlockerText'
import { ConsentBox } from './ConsentBox'
import { CostStrip } from './CostStrip'
import { ReadyPreview } from './ReadyPreview'
import { SkippedLines } from './SkippedLines'

interface SendStepProps {
  detail: OrderImportBatchDetail
  canEdit: boolean
  /** Back to the check (drafts only: an import cannot be re-mapped). */
  onBack: () => void
  onDone: (outcome: SendOutcome) => void
}

/**
 * Step 3 (الإرسال): how many orders will be confirmed, what stays out and
 * why, what it costs, and the consent -- then "استيراد فقط" or "استيراد
 * وإرسال". The reassurance that nothing is sent yet is said once, here.
 */
export function SendStep({ detail, canEdit, onBack, onDone }: SendStepProps) {
  const t = useTranslations('orderImport.send')
  const locale = useLocale() as SupportedLocale
  const send = useSendStep(detail, onDone)
  const rows = useQuery(orderImportAllRowsOptions(detail.batchId))
  const [now] = useState(() => new Date())
  const quote = send.quote.data
  const ready = detail.counts.ready ?? 0
  const draft = detail.status === 'draft'
  const busy = send.phase === 'importing' || send.phase === 'sending'
  const hours = hoursLeftToStart(detail, now)
  const statement = quote
    ? locale === 'ar'
      ? quote.attestation.text.ar
      : quote.attestation.text.en
    : null

  return (
    <ModalStepLayout
      footer={
        canEdit && (
          <SendFooter
            draft={draft}
            ready={quote?.orders ?? ready}
            phase={send.phase}
            sendAfterImport={send.sendAfterImport}
            canSend={send.canSend}
            canImportOnly={send.canImportOnly}
            quote={quote}
            batchId={detail.batchId}
            locale={locale}
            onBack={onBack}
            onSubmit={send.submit}
          />
        )
      }
    >
      <h2
        id={IMPORT_STEP_HEADING_ID}
        tabIndex={-1}
        className="sr-only focus:outline-none"
      >
        {t('heading', { count: ready })}
      </h2>

      {send.notice && (
        <ImportNotice
          tone={send.notice === 'stale' ? 'warning' : 'critical'}
          role="alert"
        >
          {t(`notice.${send.notice}`)}
        </ImportNotice>
      )}
      {send.imported && !send.notice && send.phase === 'review' && (
        <ImportNotice tone="info" role="status">
          {t('importedNotice')}
        </ImportNotice>
      )}

      <Hero detail={detail} ready={ready} />

      {rows.isPending ? (
        <Skeleton className="rounded-card h-40 w-full" />
      ) : rows.data ? (
        <>
          <ReadyPreview
            rows={rows.data.rows.filter((row) => row.outcome === 'ready')}
          />
          <SkippedLines
            batchId={detail.batchId}
            rows={rows.data.rows}
            canEdit={canEdit && draft && !busy}
            onChangePayment={draft ? onBack : undefined}
          />
        </>
      ) : null}

      {busy ? (
        <ImportProgress detail={detail} phase={send.phase} />
      ) : (
        ready > 0 && (
          <>
            {quote && <Blockers quote={quote} locale={locale} />}
            <CostStrip quote={quote} />
            {hours !== null && (
              <p className="text-warning-subtle-foreground flex items-start gap-2 text-sm leading-6">
                <Clock aria-hidden="true" className="mt-1 size-4 shrink-0" />
                {t('deadline', { hours })}
              </p>
            )}
            {statement && canEdit && (
              <ConsentBox
                statement={statement}
                checked={send.agreed}
                disabled={send.sendBlocked}
                onChange={send.setAgreed}
              />
            )}
          </>
        )
      )}
    </ModalStepLayout>
  )
}

/** The big number, what it means, and where it came from. */
function Hero({
  detail,
  ready,
}: {
  detail: OrderImportBatchDetail
  ready: number
}) {
  const t = useTranslations('orderImport.send')
  if (ready === 0)
    return (
      <ImportNotice tone="warning" role="status">
        {t('nothingReady')}
      </ImportNotice>
    )
  return (
    <div className="flex items-center gap-4">
      <p
        aria-hidden="true"
        className="text-primary text-5xl leading-none font-bold tabular-nums sm:text-6xl"
      >
        <bdi dir="ltr">{ready}</bdi>
      </p>
      <div className="min-w-0 space-y-1">
        <p className="text-foreground text-lg font-bold sm:text-xl">
          <span className="sr-only">{ready} </span>
          {t('heading', { count: ready })}
        </p>
        <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
          <FileSpreadsheet aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">
            {t('from', { file: '' })}
            <bdi>{detail.fileName}</bdi>
            {isCleanFile(detail.counts) && ` · ${t('clean')}`}
          </span>
        </p>
      </div>
    </div>
  )
}

/** Auto-verify off, a credit shortfall, or another gate: why send waits. */
function Blockers({
  quote,
  locale,
}: {
  quote: OrderImportStartQuote
  locale: SupportedLocale
}) {
  const t = useTranslations('orderImport.start')
  const blockerText = useBlockerText()
  const shortfall = shortfallOf(quote)
  const autoVerifyOff = quote.blockers.some(
    (blocker) => blocker.code === 'IMPORT_AUTO_VERIFY_DISABLED'
  )
  const others = quote.blockers.filter(
    (blocker) =>
      blocker !== shortfall && blocker.code !== 'IMPORT_AUTO_VERIFY_DISABLED'
  )
  return (
    <>
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
      {others.map((blocker) => (
        <ImportNotice key={blocker.code} tone="critical" role="alert">
          {blockerText(blocker)}
        </ImportNotice>
      ))}
    </>
  )
}

/** The import is quick: its progress stays inside the step. */
function ImportProgress({
  detail,
  phase,
}: {
  detail: OrderImportBatchDetail
  phase: 'importing' | 'sending' | string
}) {
  const t = useTranslations('orderImport.send')
  const total = detail.counts.readyAtCommit ?? detail.counts.ready ?? 0
  const imported = detail.counts.imported ?? 0
  const percent =
    phase === 'sending' || total === 0
      ? 100
      : Math.round((imported / total) * 100)
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-card border-border bg-card space-y-3 border p-4"
    >
      <p className="text-foreground text-sm font-semibold">
        {phase === 'sending' ? t('starting') : t('importing')}
      </p>
      <Progress
        value={percent}
        aria-label={phase === 'sending' ? t('starting') : t('importing')}
        indicatorClassName="motion-safe:transition-all"
      />
      {phase === 'importing' && total > 0 && (
        <p className="text-muted-foreground text-xs">
          {t('importProgress', { imported, total })}
        </p>
      )}
    </div>
  )
}

function SendFooter({
  draft,
  ready,
  phase,
  sendAfterImport,
  canSend,
  canImportOnly,
  quote,
  batchId,
  locale,
  onBack,
  onSubmit,
}: {
  draft: boolean
  ready: number
  phase: string
  sendAfterImport: boolean
  canSend: boolean
  canImportOnly: boolean
  quote: OrderImportStartQuote | undefined
  batchId: string
  locale: SupportedLocale
  onBack: () => void
  onSubmit: (send: boolean) => void
}) {
  const t = useTranslations('orderImport')
  const busy = phase === 'importing' || phase === 'sending'
  const shortfall = quote ? shortfallOf(quote) : undefined
  const sendLabel = draft
    ? t('send.importAndSend', { count: ready })
    : t('send.sendNow', { count: ready })

  const primary = shortfall ? (
    <Button asChild size="lg" className="h-12 w-full sm:h-11 sm:w-auto">
      <Link
        href={withLocale(
          billingPurchaseHref({
            credits: shortfall.suggestedPurchaseCredits ?? 0,
            returnTo: importReturnPath(batchId, true),
          }),
          locale
        )}
      >
        {t('start.buy', { credits: shortfall.suggestedPurchaseCredits ?? 0 })}
      </Link>
    </Button>
  ) : quote ? (
    <LoadingButton
      type="button"
      size="lg"
      className="h-12 w-full sm:h-11 sm:w-auto"
      disabled={!canSend || busy}
      aria-describedby={!canSend && !busy ? 'order-import-send-why' : undefined}
      loading={
        phase === 'sending' || (phase === 'importing' && sendAfterImport)
      }
      onClick={() => onSubmit(true)}
    >
      <Send aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      {sendLabel}
    </LoadingButton>
  ) : (
    // No label before the quote: it carries the count (bug 3.4).
    <Skeleton aria-hidden="true" className="rounded-control h-11 w-56" />
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="hidden items-center gap-4 sm:flex">
        {draft && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onBack}
          >
            {t('map.back')}
          </Button>
        )}
        <p className="text-muted-foreground text-sm">{t('send.reassure')}</p>
      </div>
      <p id="order-import-send-why" className="sr-only">
        {t('send.consentFirst')}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:gap-3">
        {ready > 0 && primary}
        {draft && (
          <LoadingButton
            type="button"
            variant="outline"
            className="max-sm:text-primary h-11 max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none sm:h-11"
            disabled={!canImportOnly || busy}
            loading={phase === 'importing' && !sendAfterImport}
            onClick={() => onSubmit(false)}
          >
            {t('send.importOnly')}
          </LoadingButton>
        )}
        <p className="text-muted-foreground text-center text-xs sm:hidden">
          {t('send.reassure')}
        </p>
      </div>
    </div>
  )
}
