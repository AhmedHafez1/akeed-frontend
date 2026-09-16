'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { howItWorksByPath } from '@/features/marketing/config/site'
import {
  DEFAULT_ACQUISITION_PATH,
  type AcquisitionPath,
} from '@/features/marketing/domain/acquisitionPaths'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { PathTabs } from './howItWorks/PathTabs'
import { StepGrid } from './howItWorks/StepGrid'

interface HowItWorksProps {
  /*
   * Resolved from `?path=` by the server component, so a campaign link renders
   * the matching flow in the initial HTML. Reading it here instead would mean
   * `useSearchParams()` (a Suspense boundary on this route) or a post-mount
   * setState — both worse, and neither puts the right tab in the markup.
   */
  initialPath?: AcquisitionPath
}

function HowItWorks({
  initialPath = DEFAULT_ACQUISITION_PATH,
}: HowItWorksProps) {
  const t = useTranslations('how_it_works')
  const { isRTL } = useLocaleInfo()
  const [path, setPath] = useState<AcquisitionPath>(initialPath)

  const tabLabels: Record<AcquisitionPath, string> = {
    shopify: t('tabs.shopify'),
    standalone: t('tabs.standalone'),
  }

  return (
    <Section id="how-it-works" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          title={t('section_title')}
          description={t('main_title')}
          isRTL={isRTL}
        />

        <div className="mb-8 sm:mb-10">
          <PathTabs
            value={path}
            labels={tabLabels}
            ariaLabel={t('tabs_label')}
            onChange={setPath}
          />
        </div>

        <div
          role="tabpanel"
          id={`how-it-works-panel-${path}`}
          aria-labelledby={`how-it-works-tab-${path}`}
        >
          <StepGrid
            key={path}
            steps={howItWorksByPath[path]}
            isRTL={isRTL}
            t={(key) => t(`${path}.steps.${key}`)}
          />
          <p className="text-muted-foreground mt-6 text-sm leading-6">
            {t(`${path}.footnote`)}
          </p>
        </div>
      </Container>
    </Section>
  )
}

export default HowItWorks
