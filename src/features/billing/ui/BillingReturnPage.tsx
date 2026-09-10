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
import { withLocale } from '@/shared/lib/locale'
import { Button, Card, Skeleton } from '@/shared/ui'
import { fetchPurchase } from '../api/billingApi'
import {
  formatBillingDate,
  formatCredits,
  formatMoney,
} from '../domain/billingFormatters'
import type { PurchaseDetail } from '../domain/billing.types'
import { useBillingSummary } from '../domain/BillingProvider'

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
  const { refresh: refreshSummary } = useBillingSummary()
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
          if (purchase.status === 'successful') void refreshSummary()
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
    [isValidReference, purchaseRef, refreshSummary]
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
        <Skeleton className="h-96 rounded-2xl" />
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
    ? 'bg-emerald-50 text-emerald-700'
    : pending
      ? 'bg-amber-50 text-amber-800'
      : 'bg-red-50 text-red-700'

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
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="p-6 text-center sm:p-8">
          <span
            className={`mx-auto grid size-14 place-items-center rounded-full ${tone}`}
          >
            <Icon className="size-7" aria-hidden />
          </span>
          <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
            {t('return.eyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            {description}
          </p>

          {purchase && (
            <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 text-start sm:grid-cols-2">
              <div className="bg-slate-50 p-4">
                <dt className="text-xs text-slate-500">
                  {t('return.reference')}
                </dt>
                <dd
                  className="mt-1 truncate font-mono text-xs text-slate-800"
                  dir="ltr"
                >
                  <bdi>{purchase.reference}</bdi>
                </dd>
              </div>
              <div className="bg-slate-50 p-4">
                <dt className="text-xs text-slate-500">{t('return.status')}</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {t(`purchaseStatus.${purchase.status}`)}
                </dd>
              </div>
              <div className="bg-slate-50 p-4">
                <dt className="text-xs text-slate-500">
                  {t('return.credits')}
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {formatCredits(purchase.quantity, locale)}
                </dd>
              </div>
              <div className="bg-slate-50 p-4">
                <dt className="text-xs text-slate-500">{t('return.amount')}</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {formatMoney(purchase.totalMinor, purchase.currency, locale)}
                </dd>
              </div>
              <div className="bg-slate-50 p-4 sm:col-span-2">
                <dt className="text-xs text-slate-500">
                  {t('return.updated')}
                </dt>
                <dd className="mt-1 text-sm text-slate-800">
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
              <Button
                onClick={manualRefresh}
                disabled={isRefreshing}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
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
