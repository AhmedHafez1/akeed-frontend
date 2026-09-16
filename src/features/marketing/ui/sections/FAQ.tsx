'use client'

import { useTranslations } from 'next-intl'
import { faqs } from '@/features/marketing/config/site'
import { landingInsetCardClass } from '@/features/marketing/ui/components/LandingPrimitives'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Accordion } from '@/shared/ui/accordion'
import { Container } from '@/shared/ui/container'
import { LearnMoreLink } from '@/shared/ui/docs-links'
import { FAQItem } from '@/shared/ui/faq-item'
import { Section } from '@/shared/ui/section'

function FAQ() {
  const tFaq = useTranslations('faq')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="faq" className="relative px-4 sm:px-6 lg:px-10">
      {/* Was the only section without the shared max width, so its gutters
          drifted from the rest of the page at wide viewports. */}
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          title={tFaq('section_title')}
          description={tFaq('section_description')}
          isRTL={isRTL}
        />

        {/*
         * The panel keeps its reading measure — long answers should not run the
         * full grid width — but it now starts under the heading instead of
         * being centred beneath a start-aligned title.
         */}
        <div className={cn(landingInsetCardClass, 'max-w-3xl p-6')}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem
                key={faq.key}
                value={`faq-${index}`}
                question={tFaq(`${faq.key}.question`)}
                answer={tFaq(`${faq.key}.answer`)}
              />
            ))}
          </Accordion>

          <div
            className={cn('mt-6 flex', isRTL ? 'justify-end' : 'justify-start')}
          >
            <LearnMoreLink article="generalFaq" />
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default FAQ
