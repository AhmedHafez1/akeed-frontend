'use client'

/**
 * Root Page - Mode-aware landing.
 *
 * - Embedded: sends merchants to onboarding (if pending) or dashboard.
 * - Standalone: renders the marketing homepage.
 */

import { FullPageLoader } from '@/shared/layout/FullPageLoader'
import { HomePage } from '@/features/marketing'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'

export default function Home() {
  return (
    <EmbeddedAuthGate fallback={<FullPageLoader />} onboardingGate="landing">
      <HomePage />
    </EmbeddedAuthGate>
  )
}
