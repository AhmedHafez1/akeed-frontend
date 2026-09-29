import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderOnboardingStandalone } from '../components/onboardingTestUtils'

/** A standalone step with real translations and a fresh query cache. */
export function renderStep(ui: ReactElement, lang: 'ar' | 'en' = 'ar') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return renderOnboardingStandalone(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    lang
  )
}
