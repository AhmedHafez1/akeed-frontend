'use client'

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
import Solution from '@/features/marketing/ui/sections/Solution'
import Pricing from '@/features/marketing/ui/sections/Pricing'
import WhoItsFor from '@/features/marketing/ui/sections/WhoItsFor'
import Trust from '@/features/marketing/ui/sections/Trust'
import FAQ from '@/features/marketing/ui/sections/FAQ'
import FinalCta from '@/features/marketing/ui/sections/FinalCta'

export function HomePage() {
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
          <Solution />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <HowItWorks />
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
          <Trust />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <FAQ />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Reveal>
          <FinalCta />
        </Reveal>
      </section>
      <StickyMobileCta />
    </main>
  )
}
