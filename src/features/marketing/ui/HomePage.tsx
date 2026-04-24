'use client'

import { StickyMobileCta } from '@/features/marketing/ui/components/StickyMobileCta'
import {
  landingSectionBackgroundClass,
  landingSectionChromeClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import Hero from '@/features/marketing/ui/sections/Hero'
import Problem from '@/features/marketing/ui/sections/Problem'
import HowItWorks from '@/features/marketing/ui/sections/HowItWorks'
import Solution from '@/features/marketing/ui/sections/Solution'
import Pricing from '@/features/marketing/ui/sections/Pricing'
import FAQ from '@/features/marketing/ui/sections/FAQ'

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col gap-0">
      <section className={`w-full ${landingSectionBackgroundClass}`}>
        <Hero />
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Problem />
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Solution />
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <HowItWorks />
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <Pricing />
      </section>
      <section className={`w-full ${landingSectionChromeClass}`}>
        <FAQ />
      </section>
      <StickyMobileCta />
    </main>
  )
}
