'use client'

import Link from 'next/link'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { akButton } from '@/shared/ui'
import { useBlockedOrdersBanner } from '@/features/dashboard/domain/useBlockedOrdersBanner'
import type { CapacitySummary } from '@/features/dashboard/model/dashboard.model'

/**
 * Orders kept unsent because the plan allowance or the credits ran out. Stays
 * while any are waiting; they send themselves once capacity returns, and the
 * button is the quickest way to get there.
 */
export function BlockedOrdersBanner({
  capacity,
  timeZone,
}: {
  capacity: CapacitySummary | null | undefined
  timeZone: string
}) {
  const { locale } = useLocaleInfo()
  const view = useBlockedOrdersBanner(capacity, timeZone)
  if (!view) return null

  return (
    <div
      role="alert"
      className="border-ak-danger/30 bg-ak-danger-soft rounded-ak-card flex flex-col gap-3 border px-6 py-4 md:flex-row md:items-center md:gap-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-ak-body text-ak-danger font-semibold">
          {view.title}
        </p>
        <p className="text-ak-body text-foreground">{view.body}</p>
        <p className="text-ak-body text-muted-foreground">
          {view.remaining} · {view.note}
        </p>
      </div>
      {view.cta && (
        <Link
          href={withLocale('/billing', locale)}
          className={akButton({ variant: 'tinted', size: 'row' })}
        >
          {view.cta.label}
        </Link>
      )}
    </div>
  )
}
