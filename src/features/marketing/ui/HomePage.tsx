'use client'

import {
  DEFAULT_ACQUISITION_PATH,
  type AcquisitionPath,
} from '@/features/marketing/domain/acquisitionPaths'
import { StickyMobileCta } from '@/features/marketing/ui/components/StickyMobileCta'
import {
  landingSectionBackgroundClass,
  landingSectionChromeAltClass,
  landingSectionChromeClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { Reveal } from '@/features/marketing/ui/components/Reveal'
import Hero from '@/features/marketing/ui/sections/Hero'
import Problem from '@/features/marketing/ui/sections/Problem'
import HowItWorks from '@/features/marketing/ui/sections/HowItWorks'
import Pricing from '@/features/marketing/ui/sections/Pricing'
import WhoItsFor from '@/features/marketing/ui/sections/WhoItsFor'
import Trust from '@/features/marketing/ui/sections/Trust'
import FAQ from '@/features/marketing/ui/sections/FAQ'
import FinalCta from '@/features/marketing/ui/sections/FinalCta'

interface HomePageProps {
  /** Resolved from `?path=` on the server so campaign links land on the right flow. */
  initialPath?: AcquisitionPath
}

export function HomePage({
  initialPath = DEFAULT_ACQUISITION_PATH,
}: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col gap-0">
      <section className={`w-full ${landingSectionBackgroundClass}`}>
        <Hero />
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <Problem />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Reveal>
          <Trust />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <HowItWorks initialPath={initialPath} />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Reveal>
          <Pricing />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <WhoItsFor />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Reveal>
          <FAQ />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <FinalCta />
        </Reveal>
      </section>
      <StickyMobileCta />
    </main>
  )
}
