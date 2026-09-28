'use client'

import { useParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { StandalonePageSkeleton } from '@/shared/layout/skeletons'
import { ImportRouteRedirect } from '@/features/order-imports'
import { EmbeddedImportsRedirect } from '../EmbeddedImportsRedirect'

/** The import is a modal on Verifications now; this keeps old links working. */
export default function OrderImportBatchPage() {
  const { mode } = useAkeedMode()
  const { batchId } = useParams<{ batchId: string }>()

  return (
    <EmbeddedAuthGate
      fallback={<StandalonePageSkeleton variant="dashboard" />}
      onboardingGate="dashboard"
    >
      {mode === 'EMBEDDED' ? (
        <EmbeddedImportsRedirect />
      ) : (
        <ImportRouteRedirect batchId={batchId} />
      )}
    </EmbeddedAuthGate>
  )
}
