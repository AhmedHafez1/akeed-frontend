'use client'

import { BarChart3, Clock3, MapPinned, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { problems } from '@/features/marketing/config/site'
import {
  LandingFeatureCard,
  landingCardGridVariants,
} from '@/features/marketing/ui/components/LandingFeatureCard'
import {
  LANDING_CARD_TONES,
  landingPanelClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'

const problemIcons = [Wallet, Clock3, BarChart3, MapPinned] as const

function Problem() {
  const t = useTranslations('problems')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="problem" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          title={t('title')}
          description={t('subtitle')}
          isRTL={isRTL}
        />

        {/*
         * Four cards on one row at `lg`, matching the WhoItsFor grid. The old
         * `lg:grid-cols-3 xl:grid-cols-4` left a 3+1 orphan row for most of the
         * desktop range, and its `gap-4 → gap-10` ramp grew the gutters wider
         * than any other grid on the page.
         */}
        <motion.div
          variants={landingCardGridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {problems.map((problem, index) => (
            <LandingFeatureCard
              key={problem.key}
              icon={problemIcons[index % problemIcons.length]}
              tone={LANDING_CARD_TONES[index % LANDING_CARD_TONES.length]}
              title={t(`${problem.key}.title`)}
              description={t(`${problem.key}.description`)}
              isRTL={isRTL}
            />
          ))}
        </motion.div>

        {/*
         * The closing beat. Previously a bare centred block with its own
         * `mx-4 sm:mx-6 lg:mx-8` inset — so it sat narrower than the grid above
         * it at every breakpoint — and three ad-hoc font ramps. It is a
         * statement, so it gets the page's card surface and the type scale.
         */}
        <div
          className={cn(
            landingPanelClass,
            'mt-10 flex flex-col items-center gap-3 p-8 text-center'
          )}
        >
          <p className="text-lead text-muted-foreground max-w-2xl text-pretty">
            {t('reality')}
          </p>
          <p className="text-h2 text-primary max-w-2xl text-balance">
            {t('reality_highlight')}
          </p>
        </div>
      </Container>
    </Section>
  )
}

export default Problem
