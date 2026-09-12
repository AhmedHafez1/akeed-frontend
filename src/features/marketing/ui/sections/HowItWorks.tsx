'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState, useSyncExternalStore } from 'react'
import { howItWorksByPath } from '@/features/marketing/config/site'
import {
  DEFAULT_ACQUISITION_PATH,
  isAcquisitionPath,
  type AcquisitionPath,
} from '@/features/marketing/domain/acquisitionPaths'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { PathTabs } from './howItWorks/PathTabs'
import { StepGrid } from './howItWorks/StepGrid'

/*
 * `?path=` seeds the tab for campaign deep-links.
 *
 * Read through `useSyncExternalStore` rather than `useSearchParams()`: this is a
 * client component under a statically rendered route, where that hook would
 * force a Suspense boundary or fail the prerender. The store never notifies —
 * nothing writes the param back to history, since pushState here would fight
 * the header's hash handling — so this is a one-time read that still hydrates
 * cleanly.
 */
const subscribe = () => () => {}

function getPathFromUrl(): AcquisitionPath {
  const requested = new URLSearchParams(window.location.search).get('path')
  return isAcquisitionPath(requested) ? requested : DEFAULT_ACQUISITION_PATH
}

const getServerPath = () => DEFAULT_ACQUISITION_PATH

function HowItWorks() {
  const t = useTranslations('how_it_works')
  const { isRTL } = useLocaleInfo()
  const urlPath = useSyncExternalStore(subscribe, getPathFromUrl, getServerPath)
  const [selected, setSelected] = useState<AcquisitionPath | null>(null)
  const path = selected ?? urlPath

  const tabLabels: Record<AcquisitionPath, string> = {
    shopify: t('tabs.shopify'),
    standalone: t('tabs.standalone'),
  }

  return (
    <Section id="how-it-works" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <div className="landing-section-header mb-8 sm:mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-h1 text-foreground max-w-5xl text-balance"
          >
            {t('section_title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lead text-muted-foreground max-w-3xl text-pretty"
          >
            {t('main_title')}
          </motion.p>
        </div>

        <div className="mb-8 sm:mb-10">
          <PathTabs
            value={path}
            labels={tabLabels}
            ariaLabel={t('tabs_label')}
            onChange={setSelected}
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
