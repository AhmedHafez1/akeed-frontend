'use client'

import Hero from '@/features/marketing/ui/sections/Hero'
import Problem from '@/features/marketing/ui/sections/Problem'
import HowItWorks from '@/features/marketing/ui/sections/HowItWorks'
import Solution from '@/features/marketing/ui/sections/Solution'
import Pricing from '@/features/marketing/ui/sections/Pricing'
import FAQ from '@/features/marketing/ui/sections/FAQ'
import ROICalculator from '@/features/marketing/ui/sections/ROICalculator'
import { PostFaqCta } from '@/features/marketing/ui/sections/PostFaqCta'
import { StickyMobileCta } from '@/features/marketing/ui/components/StickyMobileCta'

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col gap-0">
      <section className="w-full bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <Hero />
      </section>
      <section className="w-full border-t border-slate-200/70 bg-white">
        <Problem />
      </section>
      <section className="w-full border-t border-slate-200/70 bg-linear-to-b from-emerald-50/30 via-white to-white">
        <Solution />
      </section>
      <section className="w-full border-t border-slate-200/70 bg-white">
        <HowItWorks />
      </section>
      <section className="w-full border-t border-slate-200/70 bg-linear-to-b from-white via-emerald-50/20 to-white">
        <ROICalculator />
      </section>
      <section className="w-full border-t border-slate-200/70 bg-white">
        <Pricing />
      </section>
      <section className="w-full border-t border-slate-200/70 bg-linear-to-b from-white via-slate-50 to-white">
        <FAQ />
      </section>
      <PostFaqCta />
      <StickyMobileCta />
    </main>
  )
}
