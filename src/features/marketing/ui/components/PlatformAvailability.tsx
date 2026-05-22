'use client'

import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

interface PlatformAvailabilityProps {
  isRTL: boolean
}

export function PlatformAvailability({ isRTL }: PlatformAvailabilityProps) {
  const t = useTranslations('hero')

  return (
    <div className="rounded-2xl border border-emerald-50 bg-emerald-50/70 p-4 shadow-sm shadow-emerald-100/50 backdrop-blur-sm sm:px-5 sm:py-4">
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 sm:flex-nowrap',
          isRTL ? 'text-right' : 'text-left'
        )}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-emerald-100">
          <Image
            src="/images/landing/logos/shopify_icon_1.png"
            alt={t('shopify_available')}
            width={36}
            height={36}
            unoptimized
            className="h-8 w-8 object-contain"
          />
        </span>
        <p className="min-w-0 text-sm leading-6 font-medium text-slate-700 sm:text-base">
          {t.rich('platform_note', {
            strong: (chunks) => (
              <strong className="font-bold text-emerald-700">{chunks}</strong>
            ),
          })}
        </p>
        <div className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('platform_live_badge')}
        </div>
      </div>
    </div>
  )
}
