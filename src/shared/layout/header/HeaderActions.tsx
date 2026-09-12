import { Globe } from 'lucide-react'
import type { AcquisitionTargets } from '@/features/marketing/domain/acquisitionPaths'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'

interface HeaderActionsProps {
  locale: string
  targets: AcquisitionTargets
  ctaShopifyLabel: string
  ctaStandaloneLabel: string
  onLocaleChange: () => void
}

export function HeaderActions({
  locale,
  targets,
  ctaShopifyLabel,
  ctaStandaloneLabel,
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
      <AcquisitionCta
        target={targets.standalone}
        label={ctaStandaloneLabel}
        variant="ghost"
      />
      <AcquisitionCta
        target={targets.shopify}
        label={ctaShopifyLabel}
        variant="compact"
      />
    </div>
  )
}
