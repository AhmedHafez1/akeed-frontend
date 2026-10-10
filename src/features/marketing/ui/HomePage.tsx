'use client'

import { StickyMobileCta } from '@/features/marketing/ui/components/StickyMobileCta'
import {
  landingSectionBackgroundClass,
  landingSectionChromeAltClass,
  landingSectionChromeClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { Reveal } from '@/features/marketing/ui/components/Reveal'
import Hero from '@/features/marketing/ui/sections/Hero'
import HowItWorks from '@/features/marketing/ui/sections/HowItWorks'
import Pricing from '@/features/marketing/ui/sections/Pricing'
import Sources from '@/features/marketing/ui/sections/Sources'
import Trust from '@/features/marketing/ui/sections/Trust'
import FAQ from '@/features/marketing/ui/sections/FAQ'

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col gap-0">
      <section className={`w-full ${landingSectionBackgroundClass}`}>
        <Hero />
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <Sources />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Reveal>
          <Trust />
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
          <FAQ />
        </Reveal>
      </section>
      <StickyMobileCta />
    </main>
  )
}
