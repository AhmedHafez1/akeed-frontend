'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowUpDown, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { Button, Card, Skeleton } from '@/shared/ui'
import type { Transaction } from '../../domain/transactions'
import { TransactionsTable } from './TransactionsTable'

const PREVIEW_ROWS = 5

interface RecentActivityCardProps {
  items: Transaction[]
  isLoading: boolean
  error: boolean
  onRetry: () => void
}

export function RecentActivityCard({
  items,
  isLoading,
  error,
  onRetry,
}: RecentActivityCardProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const href = withLocale('/billing/transactions', locale)

  return (
    <Card className="overflow-hidden">
      <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span
            className="rounded-control bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center"
            aria-hidden
          >
            <ArrowUpDown className="size-4" />
          </span>
          <div>
            <h2 className="text-h3 text-foreground">
              {t('history.recentTitle')}
            </h2>
            <p className="text-muted-foreground text-body mt-1">
              {t('history.recentDescription')}
            </p>
          </div>
        </div>
        <Link
          href={href}
          className="text-primary text-body font-medium hover:underline"
        >
          {t('history.viewLog')}{' '}
          <ArrowLeft className="inline size-4 rtl:rotate-180" aria-hidden />
        </Link>
      </div>

      {error ? (
        <div className="p-6 text-center">
          <p className="text-body text-destructive">{t('history.error')}</p>
          <Button variant="outline" className="mt-3" onClick={onRetry}>
            <RefreshCw /> {t('retry')}
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="rounded-control h-12" />
          ))}
        </div>
      ) : (
        <TransactionsTable
          items={items.slice(0, PREVIEW_ROWS)}
          variant="preview"
          emptyMessage={t('history.empty')}
        />
      )}

      {!error && !isLoading && items.length > 0 && (
        <div className="border-border border-t p-4">
          <Button asChild variant="outline">
            <Link href={href}>
              {t('history.openFullLog')}
              <ArrowLeft className="rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
        </div>
      )}
    </Card>
  )
}
