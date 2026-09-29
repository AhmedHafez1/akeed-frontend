'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Package, Upload, Wallet } from 'lucide-react'
import { useBillingSummary } from '@/features/billing'
import { importModalPath } from '@/features/order-imports'
import { ManualOrderAction } from '@/features/orders'
import { formatCredits } from '@/shared/lib/money'
import { withLocale, type SupportedLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Button, akCard } from '@/shared/ui'

interface FirstOrderCardProps {
  /** Shown above the title, e.g. the skipped-test reminder. */
  banner?: ReactNode
}

/**
 * The first-run dashboard's one job: get the first real order in, by hand or
 * from a file. With no credits left both would be rejected, so the card says
 * so and points to billing instead.
 */
export function FirstOrderCard({ banner }: FirstOrderCardProps) {
  const t = useTranslations('dashboard.firstRun.firstOrder')
  const tImport = useTranslations('orderImport.entry')
  const locale = useLocale() as SupportedLocale
  const { summary } = useBillingSummary()
  const isOutOfCredits = summary?.availableCredits === 0

  return (
    <section
      aria-labelledby="first-order-title"
      className={cn(akCard, 'space-y-6 p-5 text-start sm:p-8')}
    >
      {banner}

      <header className="space-y-1.5">
        <h2 id="first-order-title" className="text-ink text-h3 font-bold">
          {t('title')}
        </h2>
        <p className="text-ink-muted text-body">{t('subtitle')}</p>
      </header>

      {isOutOfCredits ? (
        <div
          role="status"
          className="border-ak-warning-line bg-ak-warning-soft rounded-panel flex flex-col gap-3 border p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Wallet
              aria-hidden="true"
              className="text-ak-warning mt-0.5 size-5 shrink-0"
            />
            <div className="space-y-0.5">
              <p className="text-ink font-semibold">
                {t('zeroBalance.title', {
                  count: formatCredits(0, locale),
                })}
              </p>
              <p className="text-ink-muted text-sm">{t('zeroBalance.body')}</p>
            </div>
          </div>
          <Button asChild className="shrink-0 font-semibold">
            <Link href={withLocale('/billing', locale)}>
              {t('zeroBalance.action')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-brand-line bg-brand-soft rounded-panel flex flex-col gap-3 border p-5 sm:p-6">
            <Package aria-hidden="true" className="text-brand-ink size-7" />
            <h3 className="text-ink text-lg font-bold">{t('manual.title')}</h3>
            <p className="text-ink-muted flex-1 text-sm">{t('manual.body')}</p>
            <ManualOrderAction variant="tile" />
          </div>

          <div className="border-line bg-card rounded-panel flex flex-col gap-3 border p-5 sm:p-6">
            <Upload aria-hidden="true" className="text-ink-muted size-7" />
            <h3 className="text-ink text-lg font-bold">{t('file.title')}</h3>
            <p className="text-ink-muted flex-1 text-sm">{t('file.body')}</p>
            <Button
              asChild
              variant="outline"
              className="h-11 w-full gap-2 text-base font-semibold"
            >
              <Link href={withLocale(importModalPath('new'), locale)}>
                <Upload aria-hidden="true" />
                {tImport('newImport')}
              </Link>
            </Button>
          </div>
        </div>
      )}

      <p className="text-ink-muted text-sm">{t('storeLinkSoon')}</p>
    </section>
  )
}
