'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Ban,
  CircleCheckBig,
  Clock,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import {
  akButton,
  akCard,
  akNumeric,
  akPill,
  Skeleton,
  type AkPillProps,
} from '@/shared/ui'
import {
  formatBillingDate,
  formatCredits,
  formatMoney,
  formatShortRef,
} from '../domain/billingFormatters'
import type { PurchaseDetail, PurchaseStatus } from '../domain/billing.types'
import {
  resolveReturnView,
  type ReturnLook,
  type ReturnView,
} from '../domain/billingReturnView'
import { useBillingReturn } from '../domain/useBillingReturn'

const DISC: Record<ReturnLook, { icon: LucideIcon; className: string }> = {
  success: { icon: CircleCheckBig, className: 'bg-brand-soft text-brand' },
  pending: { icon: Clock, className: 'bg-ak-info-soft text-ak-info' },
  failed: { icon: X, className: 'bg-ak-danger-soft text-ak-danger' },
  expired: { icon: Clock, className: 'bg-neutral-soft text-ink-muted' },
  canceled: { icon: Ban, className: 'bg-neutral-soft text-ink-muted' },
  refunded: { icon: RotateCcw, className: 'bg-neutral-soft text-ink-muted' },
  review: {
    icon: AlertTriangle,
    className: 'bg-ak-warning-soft text-ak-warning',
  },
  problem: {
    icon: AlertTriangle,
    className: 'bg-ak-warning-soft text-ak-warning',
  },
}

const PILL_TONE: Record<PurchaseStatus, NonNullable<AkPillProps['tone']>> = {
  successful: 'brand',
  pending: 'info',
  failed: 'danger',
  expired: 'neutral',
  canceled: 'neutral',
  refunded: 'neutral',
}

const numeric = (chunks: ReactNode) => <bdi className={akNumeric}>{chunks}</bdi>

function Detail({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('bg-surface-sunken border-line px-4 py-3.5', className)}>
      <dt className="text-ak-label text-ink-muted font-normal">{label}</dt>
      <dd className="text-ak-body text-ink mt-0.5 font-semibold">{children}</dd>
    </div>
  )
}

/** The figures: a 2×2 grid from 640px, one column below it. */
function PurchaseDetails({ purchase }: { purchase: PurchaseDetail }) {
  const t = useTranslations('billing.return')
  const tStatus = useTranslations('billing.purchaseStatus')
  const { locale } = useLocaleInfo()

  return (
    <>
      <dl className="border-line rounded-ak-card mt-7 grid overflow-hidden border text-start sm:grid-cols-2">
        <Detail label={t('credits')} className="sm:border-e">
          <span dir="ltr" className={akNumeric}>
            {formatCredits(purchase.quantity, locale)}
          </span>
        </Detail>
        <Detail label={t('amount')} className="border-t sm:border-t-0">
          <bdi className={akNumeric}>
            {formatMoney(purchase.totalMinor, purchase.currency, locale)}
          </bdi>
        </Detail>
        <Detail label={t('status')} className="border-t sm:border-e">
          <span className={akPill({ tone: PILL_TONE[purchase.status] })}>
            {tStatus(purchase.status)}
          </span>
        </Detail>
        <Detail label={t('updated')} className="border-t">
          <bdi className={cn(akNumeric, 'font-medium')}>
            {formatBillingDate(purchase.updatedAt, locale)}
          </bdi>
        </Detail>
      </dl>
      <p className="text-ak-caption text-ink-muted mt-3">
        {t('reference')}{' '}
        <code
          dir="ltr"
          title={purchase.reference}
          className={cn(
            akNumeric,
            'text-ak-label bg-neutral-soft text-ink inline-block rounded-sm px-1.5 py-px font-mono font-normal'
          )}
        >
          {formatShortRef(purchase.reference)}
        </code>
      </p>
    </>
  )
}

function LoadingBody() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="mt-5 h-8 w-64 max-w-full" />
      <Skeleton className="mt-2.5 h-5 w-80 max-w-full" />
      <Skeleton className="rounded-ak-card mt-7 h-32 w-full" />
      <Skeleton className="rounded-ak-control mt-7 h-10 w-40" />
    </div>
  )
}

interface ReturnBodyProps {
  view: ReturnView
  /** The balance after a successful purchase; `null` until it is known. */
  balance: number | null
  returnTo: string | null
  onContinueImport: () => void
  isRefreshing: boolean
  onRefresh: () => void
}

function ReturnBody({
  view,
  balance,
  returnTo,
  onContinueImport,
  isRefreshing,
  onRefresh,
}: ReturnBodyProps) {
  const t = useTranslations('billing.return')
  const { locale } = useLocaleInfo()
  const disc = DISC[view.look]
  const DiscIcon = disc.icon
  const billingHref = withLocale('/billing', locale)

  return (
    <>
      <span
        className={cn(
          'mx-auto grid size-14 place-items-center rounded-full',
          disc.className
        )}
      >
        <DiscIcon aria-hidden="true" className="size-7" />
      </span>

      <h1 className="text-ak-title text-ink mt-5">
        {view.copy === 'successful'
          ? t.rich('successTitle', {
              count: view.purchase.quantity,
              value: formatCredits(view.purchase.quantity, locale),
              n: numeric,
            })
          : t(`title.${view.copy}`)}
      </h1>
      <p className="text-ak-body text-ink-muted mx-auto mt-1.5 max-w-105">
        {view.copy !== 'successful'
          ? t(`body.${view.copy}`)
          : balance !== null
            ? t.rich('successBody', {
                count: balance,
                value: formatCredits(balance, locale),
                n: numeric,
              })
            : t('successBodyNoBalance')}
      </p>

      {view.purchase && <PurchaseDetails purchase={view.purchase} />}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href={billingHref} className={akButton({ variant: 'secondary' })}>
          {t('backToBilling')}
        </Link>
        {view.primary === 'continueImport' && returnTo && (
          <Link
            href={withLocale(returnTo, locale)}
            onClick={onContinueImport}
            className={akButton({ variant: 'primary' })}
          >
            {t('backToImport')}
          </Link>
        )}
        {view.primary === 'refresh' && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={akButton({ variant: 'primary' })}
          >
            {isRefreshing ? (
              <LoaderCircle
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            {isRefreshing ? t('refreshing') : t('refresh')}
          </button>
        )}
        {view.primary === 'newPurchase' && (
          <Link href={billingHref} className={akButton({ variant: 'primary' })}>
            {t('newPurchase')}
          </Link>
        )}
      </div>
    </>
  )
}

/**
 * Back from Paymob: what happened to the payment, in one card. The status
 * disc and the title carry the outcome, the grid the figures, and at most one
 * primary action says what to do next. The card is a live region and stays
 * mounted while loading, so each status change is announced.
 */
export function BillingReturnPage() {
  const { isRTL } = useLocaleInfo()
  const { state, isRefreshing, refresh, returnTo, forgetReturnTo, balance } =
    useBillingReturn()

  const view =
    state.kind === 'loading' ? null : resolveReturnView(state, !!returnTo)

  return (
    <div
      className="mx-auto w-full max-w-150 pt-2 pb-8 sm:pt-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <section
        className={cn(akCard, 'p-8 text-center')}
        aria-live="polite"
        aria-busy={!view || undefined}
      >
        {view ? (
          <ReturnBody
            view={view}
            balance={balance}
            returnTo={returnTo}
            onContinueImport={forgetReturnTo}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
          />
        ) : (
          <LoadingBody />
        )}
      </section>
    </div>
  )
}
