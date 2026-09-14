'use client'

import { useTranslations } from 'next-intl'
import { trustPoints } from '@/features/marketing/config/site'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { TrustPoint } from './trust/TrustPoint'

function Trust() {
  const t = useTranslations('trust')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="trust" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <div className={cn('mb-10', isRTL ? 'text-right' : 'text-left')}>
          <h2 className="text-h1 text-foreground max-w-5xl text-balance">
            {t('section_title')}
          </h2>
          <p className="text-lead text-muted-foreground mt-4 max-w-3xl text-pretty">
            {t('section_description')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trustPoints.map((point) => (
            <TrustPoint key={point.key} point={point} isRTL={isRTL} />
          ))}
        </div>
      </Container>
    </Section>
  )
}

export default Trust
