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
    <div className="rounded-3xl bg-emerald-50/80 p-4 shadow-[0_18px_42px_rgba(15,118,110,0.08)] ring-1 ring-emerald-100/70 backdrop-blur-sm sm:px-5 sm:py-4">
      <div
        className={cn(
          'flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3',
          isRTL ? 'text-right' : 'text-left'
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100/80">
            <Image
              src="/images/landing/logos/shopify_icon_1.png"
              alt={t('shopify_available')}
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 object-contain"
            />
          </span>
          <p className="min-w-0 text-sm leading-6 font-semibold text-slate-700 sm:text-base">
            {t.rich('platform_note', {
              strong: (chunks) => (
                <strong className="font-extrabold text-emerald-800">
                  {chunks}
                </strong>
              ),
            })}
          </p>
        </div>
        <div className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-emerald-700 shadow-sm ring-1 ring-emerald-100 sm:ms-auto">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('platform_live_badge')}
        </div>
      </div>
    </div>
  )
}
