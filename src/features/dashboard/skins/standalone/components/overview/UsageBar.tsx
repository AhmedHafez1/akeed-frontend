'use client'

import { useId } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'

/**
 * Credit usage, shown only from 80%: amber while credits remain, red once
 * they are gone and confirmations have stopped. The standalone counterpart
 * of the embedded plan bar; here the way out is buying credits.
 */
export function UsageBar({
  usage,
}: {
  usage: NonNullable<DashboardOverview['usage']>
}) {
  const t = useTranslations('dashboard.standalone.credits')
  const { locale } = useLocaleInfo()
  const labelId = useId()
  const exhausted = usage.state === 'exhausted'
  if (usage.state === 'ok') return null

  return (
    <div
      role={exhausted ? 'alert' : 'status'}
      className={cn(
        'rounded-card flex flex-col gap-3 border p-4 md:flex-row md:items-center md:gap-6',
        exhausted
          ? 'border-destructive-border bg-destructive-subtle'
          : 'border-warning-border bg-warning-subtle'
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p
          id={labelId}
          className={cn(
            'text-sm font-semibold',
            exhausted
              ? 'text-destructive-subtle-foreground'
              : 'text-warning-subtle-foreground'
          )}
        >
          {exhausted
            ? t('exhausted')
            : t('warning', { used: usage.used, limit: usage.limit })}
        </p>
        <div
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={usage.limit}
          aria-valuenow={Math.min(usage.used, usage.limit)}
          className="bg-card h-1.5 w-full overflow-hidden rounded-full"
        >
          <div
            className={cn(
              'h-full rounded-full',
              exhausted ? 'bg-destructive' : 'bg-warning'
            )}
            style={{ width: `${Math.min(usage.percent, 100)}%` }}
          />
        </div>
      </div>
      <Link
        href={withLocale('/billing', locale)}
        className={cn(buttonVariants(), 'shrink-0')}
      >
        {t('cta')}
      </Link>
    </div>
  )
}
