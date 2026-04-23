import { CheckCircle2 } from 'lucide-react'

interface PricingHeaderProps {
  title: string
  subtitle: string
  checks: string[]
}

export function PricingHeader({ title, subtitle, checks }: PricingHeaderProps) {
  return (
    <div className="mb-8 text-center sm:mb-12">
      <h2 className="mb-4 text-2xl leading-tight font-black text-slate-700 sm:text-3xl md:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mb-8 max-w-3xl text-sm text-gray-600 sm:mb-8 sm:text-base md:text-lg">
        {subtitle}
      </p>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 text-sm font-semibold text-gray-700 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:text-base">
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
