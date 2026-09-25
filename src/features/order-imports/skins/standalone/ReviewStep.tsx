'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  CheckCircle2,
  CopyX,
  Download,
  MinusCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  LoadingButton,
  notify,
  SegmentedControl,
  Tooltip,
} from '@/shared/ui'
import {
  useCommitOrderImport,
  useDiscardOrderImport,
} from '../../api/orderImportMutations'
import {
  isOrderImportApiError,
  type OrderImportBatchDetail,
} from '../../api/orderImportsApi'
import { formatImportDate } from '../../domain/format'
import {
  countOf,
  initialReviewOutcome,
  isReviewOutcome,
  reviewOutcomes,
  type ReviewOutcome,
} from '../../domain/reviewSummary'
import { DiscardImportDialog } from './DiscardImportDialog'
import { IMPORT_STEP_HEADING_ID } from './importHeading'
import { ImportNotice } from './ImportNotice'
import { ReviewRows } from './ReviewRows'
import { WizardFooter } from './WizardFooter'
import { importModalPath } from '../../domain/importRoutes'

const tileStyles: Record<
  ReviewOutcome,
  { icon: LucideIcon; iconClass: string; activeClass: string }
> = {
  ready: {
    icon: CheckCircle2,
    iconClass: 'bg-success-subtle text-success-subtle-foreground',
    activeClass: 'border-success-border ring-success-border',
  },
  invalid: {
    icon: XCircle,
    iconClass: 'bg-destructive-subtle text-destructive-subtle-foreground',
    activeClass: 'border-destructive-border ring-destructive-border',
  },
  duplicate: {
    icon: CopyX,
    iconClass: 'bg-muted text-muted-foreground',
    activeClass: 'border-foreground/30 ring-border',
  },
  excluded: {
    icon: MinusCircle,
    iconClass: 'bg-warning-subtle text-warning-subtle-foreground',
    activeClass: 'border-warning-border ring-warning-border',
  },
}

interface ReviewStepProps {
  detail: OrderImportBatchDetail
  canEdit: boolean
  onBackToMapping: () => void
}

/** Step 3 (M4, M5): what will be imported and why the rest will not. */
export function ReviewStep({
  detail,
  canEdit,
  onBackToMapping,
}: ReviewStepProps) {
  const t = useTranslations('orderImport')
  const locale = useLocale()
  const router = useRouter()
  const discard = useDiscardOrderImport()
  const commit = useCommitOrderImport(detail.batchId)

  /**
   * The mutation writes the returned batch into the detail cache, so the
   * page moves to the committing view on its own. A refusal means another
   * tab got there first or the draft lapsed, which the refetch resolves.
   */
  const startImport = () => {
    commit.mutate(undefined, {
      onError: (error) => {
        // Each refusal has a different next step, so each gets its own
        // line rather than one generic failure.
        const code = isOrderImportApiError(error) ? error.code : undefined
        notify.error({
          message:
            code === 'IMPORT_NOTHING_TO_IMPORT'
              ? t('review.nothingReady')
              : code === 'IMPORT_BATCH_STATE_CONFLICT'
                ? t('commit.alreadyStarted')
                : code === 'IMPORT_BATCH_EXPIRED'
                  ? t('states.expired.body')
                  : t('review.importFailed'),
        })
      },
    })
  }
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [outcome, setOutcomeState] = useState<ReviewOutcome>(() => {
    const fromUrl = searchParams.get('outcome')
    return isReviewOutcome(fromUrl)
      ? fromUrl
      : initialReviewOutcome(detail.counts)
  })
  // The open tab is in the URL, so a refresh or a shared link keeps it.
  const setOutcome = (next: ReviewOutcome) => {
    setOutcomeState(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('outcome', next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const ready = countOf(detail.counts, 'ready')
  const toFix = countOf(detail.counts, 'invalid')
  const dateColumnMapped = detail.suggestions.fields.some(
    (field) => field.field === 'orderDate' && field.columns.length > 0
  )

  const discardImport = () =>
    discard.mutate(detail.batchId, {
      onSuccess: () => {
        notify.success({ message: t('discard.done') })
        router.push(withLocale(importModalPath('new'), locale))
      },
      onError: () => notify.error({ message: t('discard.failed') }),
    })

  return (
    <section aria-labelledby={IMPORT_STEP_HEADING_ID} className="space-y-5">
      <h2
        id={IMPORT_STEP_HEADING_ID}
        tabIndex={-1}
        className="text-foreground text-h3 font-semibold focus:outline-none"
      >
        {t('review.heading')}
      </h2>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {reviewOutcomes.map((tile) => {
          const style = tileStyles[tile]
          const Icon = style.icon
          const active = tile === outcome
          return (
            <li key={tile}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setOutcome(tile)}
                className={cn(
                  'rounded-card bg-card focus-visible:ring-ring flex h-full w-full flex-col gap-2 border p-4 text-start transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  active
                    ? cn('ring-1', style.activeClass)
                    : 'border-border hover:bg-muted/40'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'inline-flex size-8 items-center justify-center rounded-full',
                      style.iconClass
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-foreground text-2xl font-bold tabular-nums">
                    {countOf(detail.counts, tile)}
                  </span>
                </span>
                <span className="text-foreground text-sm font-semibold">
                  {t(`review.tiles.${tile}.label`)}
                </span>
                <span className="text-muted-foreground text-xs leading-5">
                  {t(`review.tiles.${tile}.hint`)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="space-y-3">
        {detail.orderDateMin && detail.orderDateMax ? (
          <ImportNotice tone="info">
            {t('review.banners.dateRange', {
              min: formatImportDate(detail.orderDateMin, locale),
              max: formatImportDate(detail.orderDateMax, locale),
            })}
          </ImportNotice>
        ) : !dateColumnMapped ? (
          <ImportNotice tone="info">{t('review.banners.noDate')}</ImportNotice>
        ) : null}
        {detail.oldOrderCount > 0 && (
          <ImportNotice tone="warning">
            {t('review.banners.oldOrders', { count: detail.oldOrderCount })}
          </ImportNotice>
        )}
        <ImportNotice tone="safe" role="status">
          {t('nothingSent.banner')}
        </ImportNotice>
      </div>

      <div className="rounded-card border-border bg-card overflow-hidden border">
        <div className="border-border flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <SegmentedControl
              aria-label={t('review.tabsLabel')}
              value={outcome}
              onChange={setOutcome}
              className="w-max"
              options={reviewOutcomes.map((tab) => ({
                value: tab,
                label: t(`review.tabs.${tab}`),
                count: countOf(detail.counts, tab),
              }))}
            />
          </div>
          {toFix > 0 && (
            // TODO(US-04.6-08): download GET /api/order-imports/:id/errors.csv
            // through an authenticated Blob fetch once that endpoint exists.
            <Tooltip content={t('review.downloadSoon')}>
              <Button type="button" variant="outline" size="sm" disabled>
                <Download aria-hidden="true" className="size-4" />
                {t('review.downloadErrors', { count: toFix })}
              </Button>
            </Tooltip>
          )}
        </div>
        {toFix > 0 && outcome === 'invalid' && (
          <p className="text-muted-foreground border-border border-b px-4 py-3 text-xs leading-5">
            {t('review.downloadErrorsHelp')}
          </p>
        )}
        <ReviewRows
          batchId={detail.batchId}
          outcome={outcome}
          canEdit={canEdit}
        />
      </div>

      <WizardFooter
        secondary={
          canEdit && (
            <>
              <Button type="button" variant="outline" onClick={onBackToMapping}>
                {t('review.backToMapping')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() => setConfirmDiscard(true)}
              >
                {t('review.discard')}
              </Button>
            </>
          )
        }
        primary={
          canEdit &&
          (ready === 0 ? (
            <Tooltip
              content={t('review.nothingReady')}
              className="w-full md:w-auto"
            >
              <Button
                type="button"
                size="lg"
                disabled
                className="w-full md:w-auto"
              >
                {t('review.import', { count: ready })}
              </Button>
            </Tooltip>
          ) : (
            <LoadingButton
              type="button"
              size="lg"
              className="w-full md:w-auto"
              loading={commit.isPending}
              onClick={startImport}
            >
              {t('review.import', { count: ready })}
            </LoadingButton>
          ))
        }
        note={ready === 0 ? t('review.nothingReady') : t('nothingSent.short')}
      />

      <DiscardImportDialog
        open={confirmDiscard}
        pending={discard.isPending}
        onOpenChange={setConfirmDiscard}
        onConfirm={discardImport}
      />
    </section>
  )
}
