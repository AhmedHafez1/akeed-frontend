'use client'

import { useTranslations } from 'next-intl'
import { trustPoints } from '@/features/marketing/config/site'
import { LANDING_CARD_TONES } from '@/features/marketing/ui/components/LandingPrimitives'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { TrustPoint } from './trust/TrustPoint'

function Trust() {
  const t = useTranslations('trust')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="trust" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          title={t('section_title')}
          description={t('section_description')}
          isRTL={isRTL}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trustPoints.map((point, index) => (
            <TrustPoint
              key={point.key}
              point={point}
              tone={LANDING_CARD_TONES[index % LANDING_CARD_TONES.length]}
              isRTL={isRTL}
            />
          ))}
        </div>
      </Container>
    </Section>
  )
}

export default Trust
