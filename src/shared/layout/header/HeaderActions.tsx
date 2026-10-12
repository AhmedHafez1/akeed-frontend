import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { AcquisitionTargets } from '@/features/marketing/domain/acquisitionPaths'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import { LocaleToggle } from '@/shared/layout/LocaleToggle'

interface HeaderActionsProps {
  targets: AcquisitionTargets
  ctaLabel: string
  loginLabel: string
  loginHref: string
  dashboardLabel: string
  dashboardHref: string
  isAuthenticated: boolean
}

export const headerOutlineControlClass =
  'rounded-control focus-visible:ring-primary-border inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-100 ring-1 ring-white/20 transition-colors hover:bg-white/8 hover:text-white hover:ring-white/35 focus-visible:ring-2 focus-visible:outline-none'

export function HeaderActions({
  targets,
  ctaLabel,
  loginLabel,
  loginHref,
  dashboardLabel,
  dashboardHref,
  isAuthenticated,
}: HeaderActionsProps) {
  return (
    <div className="hidden items-center gap-3 lg:flex">
      <LocaleToggle
        triggerClassName={`${headerOutlineControlClass} h-10 px-3.5`}
      />
      <Link
        href={isAuthenticated ? dashboardHref : loginHref}
        className={`${headerOutlineControlClass} h-10 px-5`}
      >
        {isAuthenticated ? dashboardLabel : loginLabel}
      </Link>
      <AcquisitionCta
        target={targets.standalone}
        label={ctaLabel}
        variant="compact"
        className="h-10 py-0"
        trailing={
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
        }
      />
    </div>
  )
}
