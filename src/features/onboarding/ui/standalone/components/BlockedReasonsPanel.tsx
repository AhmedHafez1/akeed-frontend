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
      className="border-warning-border bg-warning-subtle rounded-xl border p-4 text-start"
    >
      <h3 className="text-warning-subtle-foreground flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
        {t('blockedHeading')}
      </h3>
      <ul className="text-warning-subtle-foreground mt-2 list-disc space-y-1 ps-5 text-sm">
        {reasons.map((reason) => (
          <li key={reason}>{t(`blockers.${reason}`)}</li>
        ))}
      </ul>
    </div>
  )
}
