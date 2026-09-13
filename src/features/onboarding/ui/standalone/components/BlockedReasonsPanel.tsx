'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StandaloneSetupBlockedReason } from '@/features/onboarding/domain/onboarding.types'

interface BlockedReasonsPanelProps {
  reasons: readonly StandaloneSetupBlockedReason[]
}

/**
 * Renders the backend's typed blocked reasons verbatim. Blockers are never
 * collapsed into a generic error — each one keeps its own localized message.
 */
export function BlockedReasonsPanel({ reasons }: BlockedReasonsPanelProps) {
  const t = useTranslations('standaloneOnboarding')

  if (reasons.length === 0) return null

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-start"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
        {t('blockedHeading')}
      </h3>
      <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-amber-800">
        {reasons.map((reason) => (
          <li key={reason}>{t(`blockers.${reason}`)}</li>
        ))}
      </ul>
    </div>
  )
}
