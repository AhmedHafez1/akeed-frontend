import { Globe } from 'lucide-react'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'

interface HeaderActionsProps {
  locale: string
  ctaLabel: string
  onLocaleChange: () => void
}

export function HeaderActions({
  locale,
  ctaLabel,
  onLocaleChange,
}: HeaderActionsProps) {
  return (
    <div className="hidden items-center gap-3 md:flex">
      <button
        onClick={onLocaleChange}
        className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-sm font-semibold text-slate-100 ring-1 ring-white/10 transition-colors hover:bg-white/12 hover:text-white hover:ring-emerald-400/35"
        suppressHydrationWarning
      >
        <Globe className="h-4 w-4" />
        <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
      </button>
      <a
        href={SHOPIFY_APP_STORE_LISTING_URL}
        className="group rounded-control bg-primary text-primary-foreground shadow-brand hover:bg-primary-hover relative overflow-hidden px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5"
        suppressHydrationWarning
      >
        <span className="relative z-10">{ctaLabel}</span>
      </a>
    </div>
  )
}
