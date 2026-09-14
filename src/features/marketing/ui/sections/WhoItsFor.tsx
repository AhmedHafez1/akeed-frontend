'use client'

import { useTranslations } from 'next-intl'
import { audiences } from '@/features/marketing/config/site'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { AudienceCard } from './whoItsFor/AudienceCard'

function WhoItsFor() {
  const t = useTranslations('who_its_for')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="who-its-for" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          title={t('section_title')}
          description={t('section_description')}
          isRTL={isRTL}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {audiences.map((audience) => (
            <AudienceCard key={audience.key} audience={audience} />
          ))}
        </div>

        <p
          className={cn(
            'text-muted-foreground mt-8 text-sm leading-6',
            isRTL ? 'text-right' : 'text-left'
          )}
        >
          {t('not_for')}
        </p>
      </Container>
    </Section>
  )
}

export default WhoItsFor
