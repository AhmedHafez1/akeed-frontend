'use client'

import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import ScrollDownArrow from './ScrollDownArrow'
import { ROI_DATA } from '@/features/marketing/config/roi'
import { ROICalculatorHeader } from './roi/ROICalculatorHeader'
import { ROICalculatorMobileCards } from './roi/ROICalculatorMobileCards'
import { ROICalculatorTable } from './roi/ROICalculatorTable'
import { ROICalculatorNote } from './roi/ROICalculatorNote'

export default function ROICalculator() {
  const t = useTranslations('roi_calculator')

  return (
    <Section
      id="calculator"
      className="relative bg-linear-to-b from-white via-emerald-50/30 to-white px-4 sm:px-6 md:px-12 lg:px-24 xl:px-48"
    >
      <Container>
        <ROICalculatorHeader title={t('section_title')} />

        <ROICalculatorMobileCards rows={ROI_DATA} t={t} />

        <ROICalculatorTable rows={ROI_DATA} t={t} />

        <ROICalculatorNote noteLabel={t('note')} />

        {/* Scroll Indicator */}
        <ScrollDownArrow to="pricing" className="hidden sm:block" />
      </Container>
    </Section>
  )
}
