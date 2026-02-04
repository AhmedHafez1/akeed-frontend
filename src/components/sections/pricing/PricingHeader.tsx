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
      <p className="mb-8 text-sm text-gray-600 sm:mb-8 sm:text-base">
        {subtitle}
      </p>

      <div className="flex flex-col items-start gap-3 text-sm font-bold text-gray-700 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4 md:gap-6 md:text-base">
        {checks.map((check) => (
          <div key={check} className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 sm:h-6 sm:w-6" />
            <span>{check}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
