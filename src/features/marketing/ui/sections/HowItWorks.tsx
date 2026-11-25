'use client'

import { useTranslations } from 'next-intl'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { HowItWorksFlow } from './howItWorks/HowItWorksFlow'

/**
 * One flow for every order source. Only where the order comes from differs,
 * and the start-route cards further down already say that.
 */
function HowItWorks() {
  const t = useTranslations('how_it_works')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="how-it-works" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-6xl">
        <LandingSectionHeading
          title={t('section_title')}
          description={t('main_title')}
          isRTL={isRTL}
        />

        <HowItWorksFlow />
      </Container>
    </Section>
  )
}

export default HowItWorks
