import type { ReactNode, SVGProps } from 'react'
import { BadgePercent, ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface PricingCheck {
  key: string
  label: string
}

interface PricingHeaderProps {
  eyebrow: string
  title: ReactNode
  subtitle: string
  checks: PricingCheck[]
  isRTL: boolean
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

const checkIcons: Record<
  string,
  (props: SVGProps<SVGSVGElement>) => ReactNode
> = {
  whatsapp: WhatsAppIcon,
  security: ShieldCheck,
  pricing: BadgePercent,
}

export function PricingHeader({
  title,
  subtitle,
  checks,
  isRTL,
}: PricingHeaderProps) {
  return (
    <div className="mx-auto mb-10 max-w-6xl text-center sm:mb-12 lg:mb-16">
      <h2 className="mx-auto mt-6 max-w-5xl text-[clamp(2.5rem,5.8vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.06em] text-balance text-slate-950">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-3xl text-[1.05rem] leading-8 font-medium text-slate-500 sm:text-xl">
        {subtitle}
      </p>

      <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3 xl:mt-12">
        {checks.map((check) => {
          const Icon = checkIcons[check.key] ?? ShieldCheck

          return (
            <article
              key={check.key}
              className={cn(
                'flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:px-6',
                isRTL && 'text-right'
              )}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Icon className="h-7 w-7" />
              </div>
              <p className="text-base leading-7 font-medium text-slate-800 sm:text-lg sm:leading-8">
                {check.label}
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
