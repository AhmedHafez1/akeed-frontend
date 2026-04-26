import type { ReactNode } from 'react'

interface PricingHeaderProps {
  eyebrow: string
  title: ReactNode
  subtitle: string
  isRTL: boolean
}

export function PricingHeader({ title }: PricingHeaderProps) {
  return (
    <div className="mx-auto mb-10 sm:mb-12 lg:mb-20">
      <div className="landing-section-header">
        <h2 className="landing-section-title max-w-5xl">{title}</h2>
      </div>
    </div>
  )
}
