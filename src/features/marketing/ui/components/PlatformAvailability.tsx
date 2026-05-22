'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

interface PlatformAvailabilityProps {
  isRTL: boolean
}

export function PlatformAvailability({ isRTL }: PlatformAvailabilityProps) {
  const t = useTranslations('hero')

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <p className="min-w-0 text-sm leading-6 font-normal text-slate-700 sm:text-base">
          {t.rich('platform_note', {
            strong: (chunks) => (
              <strong className="font-semibold text-emerald-800">
                {chunks}
              </strong>
            ),
          })}
        </p>
      </div>
    </div>
  )
}
