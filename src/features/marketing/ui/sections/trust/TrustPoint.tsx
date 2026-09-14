'use client'

import { useTranslations } from 'next-intl'
import type { TrustPoint as TrustPointModel } from '@/features/marketing/config/site'
import {
  LandingIconBadge,
  type LandingIconTone,
  landingInsetCardClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'

interface TrustPointProps {
  point: TrustPointModel
  tone: LandingIconTone
  isRTL: boolean
}

export function TrustPoint({ point, tone, isRTL }: TrustPointProps) {
  const t = useTranslations('trust')

  return (
    <div
      className={cn(
        landingInsetCardClass,
        'flex flex-col gap-3 p-6',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      <LandingIconBadge icon={point.icon} size="sm" tone={tone} />
      <p className="text-foreground text-base font-semibold">
        {t(`${point.key}.title`)}
      </p>
      <p className="text-muted-foreground text-sm leading-6">
        {t(`${point.key}.description`)}
      </p>
    </div>
  )
}
