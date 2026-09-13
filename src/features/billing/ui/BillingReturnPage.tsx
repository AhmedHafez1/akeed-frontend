'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import { withLocale } from '@/shared/lib/locale'
import { Button, Card, Skeleton } from '@/shared/ui'
import { fetchPurchase } from '../api/billingApi'
import {
  formatBillingDate,
  formatCredits,
  formatMoney,
} from '../domain/billingFormatters'
import type { PurchaseDetail } from '../domain/billing.types'

const PURCHASE_REFERENCE = /^akd_[a-f0-9]{32}$/
const POLL_INTERVAL_MS = 2000
const MAX_POLL_COUNT = 5

type ReturnState =
  | { kind: 'invalid' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'stale'; purchase: PurchaseDetail }
  | { kind: 'purchase'; purchase: PurchaseDetail }

function isTerminal(purchase: PurchaseDetail) {
  return purchase.status !== 'pending' || purchase.reconciliationRequired
}

export function BillingReturnPage() {
  const t = useTranslations('billing')
  const { locale, isRTL } = useLocaleInfo()
  const searchParams = useSearchParams()
  const purchaseRef = searchParams.get('purchaseRef') ?? ''
  const isValidReference = PURCHASE_REFERENCE.test(purchaseRef)
  const emitDomainEvent = useEmitDomainEvent()
  const [state, setState] = useState<ReturnState>(
    isValidReference ? { kind: 'loading' } : { kind: 'invalid' }
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runIdRef = useRef(0)

  const load = useCallback(
    async (pollCount = 0, manual = false) => {
      if (!isValidReference) {
        setState({ kind: 'invalid' })
        return
      }
      const runId = ++runIdRef.current
      if (manual) setIsRefreshing(true)
      try {
        const purchase = await fetchPurchase(purchaseRef)
        if (runId !== runIdRef.current) return
        if (isTerminal(purchase)) {
          setState({ kind: 'purchase', purchase })
          if (purchase.status === 'successful')
            void emitDomainEvent('credits.purchased')
          return
        }
        if (pollCount >= MAX_POLL_COUNT) {
          setState({ kind: 'stale', purchase })
          return
        }
        setState({ kind: 'purchase', purchase })
        timerRef.current = setTimeout(
          () => void load(pollCount + 1),
          POLL_INTERVAL_MS
        )
      } catch {
        if (runId === runIdRef.current) setState({ kind: 'error' })
      } finally {
        if (manual && runId === runIdRef.current) setIsRefreshing(false)
      }
    },
    [emitDomainEvent, isValidReference, purchaseRef]
  )

  useEffect(() => {
    void load()
    return () => {
      runIdRef.current += 1
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [load])

  const manualRefresh = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    void load(0, true)
  }

  if (state.kind === 'loading') {
    return (
      <section className="mx-auto max-w-xl py-10" aria-busy>
        <Skeleton className="rounded-panel h-96" />
      </section>
    )
  }

  const purchase =
    state.kind === 'purchase' || state.kind === 'stale' ? state.purchase : null
  const successful = purchase?.status === 'successful'
  const pending = purchase?.status === 'pending'
  const Icon = successful
    ? CheckCircle2
    : pending
      ? Clock3
      : state.kind === 'invalid' || state.kind === 'error'
        ? AlertTriangle
        : XCircle
  const tone = successful
    ? 'bg-primary-subtle text-primary'
    : pending
      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-100'
      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'

  let title = t('return.errorTitle')
  let description = t('return.errorDescription')
  if (state.kind === 'invalid') {
    title = t('return.invalidTitle')
    description = t('return.invalidDescription')
  } else if (state.kind === 'stale') {
    title = t('return.staleTitle')
    description = t('return.staleDescription')
  } else if (purchase?.reconciliationRequired) {
    title = t('return.reconciliationTitle')
    description = t('return.reconciliationDescription')
  } else if (purchase) {
    title = t(`return.statusTitle.${purchase.status}`)
    description = t(`return.statusDescription.${purchase.status}`)
  }

  return (
    <section
      className="mx-auto max-w-xl py-6 sm:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className="overflow-hidden">
        <div className="p-6 text-center sm:p-8">
          <span
            className={`mx-auto grid size-14 place-items-center rounded-full ${tone}`}
          >
            <Icon className="size-7" aria-hidden />
          </span>
          <p className="text-primary text-caption mt-5 font-semibold tracking-[0.16em] uppercase">
            {t('return.eyebrow')}
          </p>
          <h1 className="text-h2 text-foreground mt-2">{title}</h1>
          <p className="text-muted-foreground text-body mx-auto mt-2 max-w-md">
            {description}
          </p>

          {purchase && (
            <dl className="rounded-card border-border bg-border mt-6 grid gap-px overflow-hidden border text-start sm:grid-cols-2">
              <div className="bg-muted/40 p-4">
                <dt className="text-muted-foreground text-xs">
                  {t('return.reference')}
                </dt>
                <dd
                  className="text-foreground mt-1 truncate font-mono text-xs"
                  dir="ltr"
                >
                  <bdi>{purchase.reference}</bdi>
                </dd>
              </div>
              <div className="bg-muted/40 p-4">
                <dt className="text-muted-foreground text-xs">
                  {t('return.status')}
                </dt>
                <dd className="text-foreground mt-1 font-medium">
                  {t(`purchaseStatus.${purchase.status}`)}
                </dd>
              </div>
              <div className="bg-muted/40 p-4">
                <dt className="text-muted-foreground text-xs">
                  {t('return.credits')}
                </dt>
                <dd className="text-foreground mt-1 font-semibold">
                  {formatCredits(purchase.quantity, locale)}
                </dd>
              </div>
              <div className="bg-muted/40 p-4">
                <dt className="text-muted-foreground text-xs">
                  {t('return.amount')}
                </dt>
                <dd className="text-foreground mt-1 font-semibold">
                  {formatMoney(purchase.totalMinor, purchase.currency, locale)}
                </dd>
              </div>
              <div className="bg-muted/40 p-4 sm:col-span-2">
                <dt className="text-muted-foreground text-xs">
                  {t('return.updated')}
                </dt>
                <dd className="text-foreground text-body mt-1">
                  {formatBillingDate(purchase.updatedAt, locale)}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={withLocale('/billing', locale)}>
                {t('return.backToBilling')}
              </Link>
            </Button>
            {(pending || state.kind === 'error') && (
              <Button onClick={manualRefresh} disabled={isRefreshing}>
                <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? t('return.refreshing') : t('return.refresh')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}
