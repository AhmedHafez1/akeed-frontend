'use client'

import { useParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { StandalonePageSkeleton } from '@/shared/layout/skeletons'
import { OrderImportBatchStandalone } from '@/features/order-imports'
import { EmbeddedImportsRedirect } from '../EmbeddedImportsRedirect'

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
        <OrderImportBatchStandalone batchId={batchId} />
      )}
    </EmbeddedAuthGate>
  )
}
