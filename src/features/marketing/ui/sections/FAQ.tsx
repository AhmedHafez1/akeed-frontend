'use client'

import { useTranslations } from 'next-intl'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { motion } from 'framer-motion'
import { Accordion } from '@/shared/ui/accordion'
import { FAQItem } from '@/shared/ui/faq-item'
import { faqs } from '@/features/marketing/config/site'

function FAQ() {
  const tFaq = useTranslations('faq')

  return (
    <Section id="faq" className="relative px-4 sm:px-6 lg:px-10">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm"
        >
          <h2 className="landing-section-title mx-auto mb-4 max-w-4xl text-center">
            {tFaq('section_title')}
          </h2>
          <p className="landing-subtitle mx-auto mb-8 max-w-3xl text-center sm:mb-10 lg:mb-14">
            {tFaq('section_description')}
          </p>
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
