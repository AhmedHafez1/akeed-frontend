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
import Outcomes from '@/features/marketing/ui/sections/Outcomes'
import Pricing from '@/features/marketing/ui/sections/Pricing'
import Sources from '@/features/marketing/ui/sections/Sources'
import Trust from '@/features/marketing/ui/sections/Trust'
import FAQ from '@/features/marketing/ui/sections/FAQ'

interface HomePageProps {
  confirmedOrdersTotal?: number | null
}

export function HomePage({ confirmedOrdersTotal = null }: HomePageProps) {
  return (
    <main className="flex min-h-screen flex-col gap-0">
      <section className={`w-full ${landingSectionBackgroundClass}`}>
        <Hero confirmedOrdersTotal={confirmedOrdersTotal} />
      </section>
      <section className={`w-full ${landingSectionChromeAltClass}`}>
        <Reveal>
          <HowItWorks />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Reveal>
          <Outcomes />
        </Reveal>
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
          <Pricing />
        </Reveal>
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Reveal>
          <FAQ />
        </Reveal>
      </section>
      <StickyMobileCta />
    </main>
  )
}
