'use client'

import { useTranslations } from 'next-intl'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'

function FinalCta() {
  const t = useTranslations('final_cta')
  const { isRTL, targets } = useAcquisition()

  return (
    <Section id="final-cta" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <div
          className={cn(
            'mx-auto flex max-w-3xl flex-col items-center gap-6 text-center'
          )}
        >
          <p className="text-primary text-sm font-semibold">{t('eyebrow')}</p>
          <h2 className="text-h1 text-foreground text-balance">{t('title')}</h2>
          <p className="text-lead text-muted-foreground text-pretty">
            {t('description')}
          </p>

          <div
            className={cn(
              'flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row',
              isRTL && 'sm:flex-row-reverse'
            )}
          >
            <AcquisitionCta
              target={targets.shopify}
              label={t('cta_shopify')}
              variant="primary"
              className="w-full sm:w-auto sm:min-w-64"
            />
            <AcquisitionCta
              target={targets.standalone}
              label={t('cta_standalone')}
              note={t('cta_standalone_note')}
              variant="secondary"
              className="w-full sm:w-auto sm:min-w-64"
            />
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default FinalCta
