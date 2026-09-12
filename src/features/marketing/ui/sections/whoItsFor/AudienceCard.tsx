'use client'

import { useTranslations } from 'next-intl'
import type { Audience } from '@/features/marketing/config/site'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import {
  LandingIconBadge,
  landingCardClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'

interface AudienceCardProps {
  audience: Audience
}

export function AudienceCard({ audience }: AudienceCardProps) {
  const t = useTranslations('who_its_for')
  const { isRTL, targets } = useAcquisition()

  return (
    <article
      className={cn(
        landingCardClass,
        'flex flex-col gap-4 p-6',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      <LandingIconBadge icon={audience.icon} size="sm" />
      <h3 className="text-foreground text-lg font-semibold">
        {t(`${audience.key}.title`)}
      </h3>
      <p className="text-muted-foreground text-sm leading-6">
        {t(`${audience.key}.description`)}
      </p>
      <AcquisitionCta
        target={targets[audience.path]}
        label={t(`${audience.key}.cta`)}
        variant="compactSecondary"
        className="mt-auto w-full"
      />
    </article>
  )
}
