'use client'

import Hero from '@/features/marketing/ui/sections/Hero'
import Problem from '@/features/marketing/ui/sections/Problem'
import HowItWorks from '@/features/marketing/ui/sections/HowItWorks'
import Solution from '@/features/marketing/ui/sections/Solution'
import Pricing from '@/features/marketing/ui/sections/Pricing'
import FAQ from '@/features/marketing/ui/sections/FAQ'
import ROICalculator from '@/features/marketing/ui/sections/ROICalculator'

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col gap-0">
      <section className="w-full bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <Hero />
      </section>
      <section className="w-full border-t bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <Problem />
      </section>
      <section className="w-full border-t bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <Solution />
      </section>
      <section className="w-full border-t bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <HowItWorks />
      </section>
      <section className="w-full border-t bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <ROICalculator />
      </section>
      <section className="w-full border-t bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <Pricing />
      </section>
      <section className="w-full border-t bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <FAQ />
      </section>
    </main>
  )
}
