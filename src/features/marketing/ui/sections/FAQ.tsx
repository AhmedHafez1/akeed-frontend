'use client'

import { useTranslations } from 'next-intl'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { motion } from 'framer-motion'
import { Accordion } from '@/shared/ui/accordion'
import { FAQItem } from '@/shared/ui/faq-item'
import { faqs } from '@/features/marketing/config/site'
import { landingInsetCardClass } from '@/features/marketing/ui/components/LandingPrimitives'

function FAQ() {
  const tFaq = useTranslations('faq')

  return (
    <Section id="faq" className="relative px-4 sm:px-6 lg:px-10">
      <Container>
        <div className="landing-section-header mb-10 sm:mb-12 lg:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="landing-section-title max-w-4xl"
          >
            {tFaq('section_title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="landing-subtitle max-w-3xl"
          >
            {tFaq('section_description')}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`mx-auto max-w-3xl p-6 ${landingInsetCardClass}`}
        >
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
        </motion.div>
      </Container>
    </Section>
  )
}

export default FAQ
