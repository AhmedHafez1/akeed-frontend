'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { StandalonePageSkeleton } from '@/shared/layout/skeletons'
import { OrderImportNewStandalone } from '@/features/order-imports'
import { EmbeddedImportsRedirect } from '../EmbeddedImportsRedirect'

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
        <OrderImportNewStandalone />
      )}
    </EmbeddedAuthGate>
  )
}
