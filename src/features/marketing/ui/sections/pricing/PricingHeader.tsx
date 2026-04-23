import { CheckCircle2 } from 'lucide-react'

interface PricingHeaderProps {
  title: string
  subtitle: string
  checks: string[]
}

export function PricingHeader({ title, subtitle, checks }: PricingHeaderProps) {
  return (
    <div className="landing-section-header mb-10 sm:mb-12">
      <h2 className="landing-section-title max-w-4xl">{title}</h2>
      <p className="landing-subtitle max-w-3xl text-slate-600">{subtitle}</p>

      <div className="mx-auto mt-1 grid max-w-4xl grid-cols-1 gap-3 text-sm font-semibold text-gray-700 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:text-base">
        {checks.map((check) => (
          <div
            key={check}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-center shadow-sm"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 sm:h-6 sm:w-6" />
            <span>{check}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
