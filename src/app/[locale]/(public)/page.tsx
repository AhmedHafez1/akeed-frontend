'use client'

/**
 * Root Page - Mode-aware landing.
 *
 * - Embedded: sends merchants to onboarding (if pending) or dashboard.
 * - Standalone: renders the marketing homepage.
 */

import { HomePage } from '@/features/marketing'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'

export default function Home() {
  return (
    <EmbeddedAuthGate onboardingGate="landing">
      <HomePage />
    </EmbeddedAuthGate>
  )
}
