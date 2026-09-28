'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { StandalonePageSkeleton } from '@/shared/layout/skeletons'
import { ImportRouteRedirect } from '@/features/order-imports'
import { EmbeddedImportsRedirect } from '../EmbeddedImportsRedirect'

/** The import is a modal on Verifications now; this keeps old links working. */
export default function NewOrderImportPage() {
  const { mode } = useAkeedMode()

  return (
    <EmbeddedAuthGate
      fallback={<StandalonePageSkeleton variant="dashboard" />}
      onboardingGate="dashboard"
    >
      {mode === 'EMBEDDED' ? (
        <EmbeddedImportsRedirect />
      ) : (
        <ImportRouteRedirect />
      )}
    </EmbeddedAuthGate>
  )
}
