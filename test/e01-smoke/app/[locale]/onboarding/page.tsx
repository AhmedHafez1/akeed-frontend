'use client'

import { useState } from 'react'
import { StandaloneOnboardingPage } from '@/features/onboarding'
import { onboardingFixtureCounts } from '../onboardingFixture'

export default function StandaloneOnboardingFixturePage() {
  const [counts, setCounts] = useState({
    reads: 0,
    writes: 0,
    completions: 0,
    state: 'pending',
  })
  return (
    <>
      <aside style={{ padding: 12, borderBottom: '1px solid #ccc' }}>
        <strong>E03 isolated onboarding fixture</strong>{' '}
        <button onClick={() => setCounts(onboardingFixtureCounts())}>
          Inspect onboarding calls
        </button>{' '}
        <output aria-label="Onboarding fixture calls">
          {JSON.stringify(counts)}
        </output>
      </aside>
      <StandaloneOnboardingPage />
    </>
  )
}
