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
        className="flex items-center gap-2 rounded-full border border-emerald-100/70 bg-white/80 px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        suppressHydrationWarning
      >
        <Globe className="h-4 w-4" />
        <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
      </button>
      <a
        href={SHOPIFY_APP_STORE_LISTING_URL}
        className="group relative overflow-hidden rounded-lg bg-linear-to-r from-emerald-700 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        suppressHydrationWarning
      >
        <span className="relative z-10">{ctaLabel}</span>
        <div className="absolute inset-0 bg-linear-to-r from-emerald-600 to-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    </div>
  )
}
