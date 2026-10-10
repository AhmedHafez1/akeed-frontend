'use client'

import { useTranslations } from 'next-intl'
import { howItWorksSteps } from '@/features/marketing/config/site'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { StepGrid } from './howItWorks/StepGrid'

/**
 * One flow for every order source. Only where the order comes from differs,
 * and the start-route cards above already say that.
 */
function HowItWorks() {
  const t = useTranslations('how_it_works')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="how-it-works" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          title={t('section_title')}
          description={t('main_title')}
          isRTL={isRTL}
        />

        <StepGrid
          steps={howItWorksSteps}
          isRTL={isRTL}
          t={(key) => t(`steps.${key}`)}
        />
      </Container>
    </Section>
  )
}

export default HowItWorks
