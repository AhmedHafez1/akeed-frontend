'use client'

import { useSearchParams } from 'next/navigation'
import Pricing from '@/features/marketing/ui/sections/Pricing'

/**
 * The public pricing section. `?own=on` forces the own-number promotion that
 * NEXT_PUBLIC_OWN_NUMBER_PRICING_ENABLED controls in a real deploy; without it
 * the section uses the flag, which is off here.
 */
export default function PricingFixturePage() {
  const own = useSearchParams().get('own')
  return (
    <main className="bg-background min-h-screen">
      {own === 'on' ? <Pricing showOwnNumber /> : <Pricing />}
    </main>
  )
}
