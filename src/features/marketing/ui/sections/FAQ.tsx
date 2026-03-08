'use client'

import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { motion } from 'framer-motion'
import { Accordion } from '@/components/ui/accordion'
import { FAQItem } from '@/components/ui/faq-item'
import { faqs } from '@/config/site'

function FAQ() {
  const tFaq = useTranslations('faq')

  return (
    <Section
      id="faq"
      className="relative px-4 sm:px-6 md:px-12 lg:px-24 xl:px-48"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm"
        >
          <h2 className="mb-4 text-center text-2xl leading-tight font-black text-slate-700 sm:text-3xl md:text-4xl lg:text-5xl">
            {tFaq('section_title')}
          </h2>
          <p className="mb-8 text-center text-lg font-medium text-slate-600 sm:text-xl lg:mb-16">
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
