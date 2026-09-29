'use client'

import { Suspense, useState } from 'react'
import { StandaloneOnboardingPage } from '@/features/onboarding'
import { StandaloneOnboardingShell } from '@/shared/layout/StandaloneOnboardingShell'
import {
  onboardingFixtureCounts,
  simulateOnboardingTap,
} from '../onboardingFixture'

export default function StandaloneOnboardingFixturePage() {
  const [counts, setCounts] = useState(() => ({}))
  return (
    <Suspense>
      <StandaloneOnboardingShell>
        <StandaloneOnboardingPage />
      </StandaloneOnboardingShell>
      <aside
        data-fixture-controls
        style={{
          position: 'fixed',
          insetInlineEnd: 8,
          bottom: 8,
          zIndex: 60,
          maxWidth: 360,
          padding: 8,
          border: '1px solid #ccc',
          borderRadius: 8,
          background: '#fff',
          fontSize: 12,
        }}
      >
        <strong>E03 onboarding v2 fixture</strong>{' '}
        <button onClick={() => simulateOnboardingTap()}>
          Simulate tap Confirm
        </button>{' '}
        <button onClick={() => setCounts(onboardingFixtureCounts())}>
          Inspect onboarding calls
        </button>
        <output
          aria-label="Onboarding fixture calls"
          style={{ display: 'block' }}
        >
          {JSON.stringify(counts)}
        </output>
      </aside>
    </Suspense>
  )
}
