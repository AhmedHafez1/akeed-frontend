'use client'

import { useTranslations } from 'next-intl'

export function StandaloneVerificationsSkeleton() {
  const t = useTranslations('dashboard.verifications')
  return (
    <div role="status" aria-label={t('loading')}>
      <span className="sr-only">{t('loading')}</span>
      <div
        aria-hidden="true"
        className="border-border bg-muted/40 hidden grid-cols-[24fr_24fr_8fr_15fr_12fr_17fr] gap-5 border-b px-5 py-4 md:grid"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="bg-muted h-4 w-3/4 animate-pulse rounded"
          />
        ))}
      </div>
      <div aria-hidden="true" className="grid gap-3 p-3 md:gap-0 md:p-0">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="border-border md:border-border grid grid-cols-2 gap-5 rounded-xl border p-5 md:grid-cols-[24fr_24fr_8fr_15fr_12fr_17fr] md:rounded-none md:border-0 md:border-b"
          >
            {Array.from({ length: 6 }, (_, column) => (
              <div
                key={column}
                className={`space-y-3 ${column < 2 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
