import { Globe } from 'lucide-react'

interface HeaderActionsProps {
  locale: string
  ctaLabel: string
  onLocaleChange: () => void
  onCtaClick: () => void
}

export function HeaderActions({
  locale,
  ctaLabel,
  onLocaleChange,
  onCtaClick,
}: HeaderActionsProps) {
  return (
    <div className="hidden items-center gap-3 md:flex">
      <button
        onClick={onLocaleChange}
        className="flex items-center gap-2 rounded-full border border-orange-100/70 bg-white/80 px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:border-orange-200 hover:text-orange-700"
        suppressHydrationWarning
      >
        <Globe className="h-4 w-4" />
        <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
      </button>
      <button
        onClick={onCtaClick}
        className="group hover:-translate-y- relative overflow-hidden rounded-lg bg-linear-to-r from-orange-600 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg"
        suppressHydrationWarning
      >
        <span className="relative z-10">{ctaLabel}</span>
        <div className="absolute inset-0 bg-linear-to-r from-orange-500 to-orange-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </div>
  )
}
