'use client'

import Hero from '@/components/sections/Hero'
import Problem from '@/components/sections/Problem'
import HowItWorks from '@/components/sections/HowItWorks'
import Solution from '@/components/sections/Solution'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import ROICalculator from '@/components/sections/ROICalculator'
import { useShopifySessionToken } from '@/hooks/useAkeedMode'

export default function Home() {
  const { getSessionToken } = useShopifySessionToken()

  const handleClick = async () => {
    const token = await getSessionToken()
    console.log('[Token]', token)
  }

  return (
    <main className="flex min-h-screen flex-col gap-0">
      <section className="w-full bg-linear-to-b from-gray-100 via-gray-200 to-gray-50">
        <Hero />
        <button onClick={handleClick}>Get Token</button>
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
