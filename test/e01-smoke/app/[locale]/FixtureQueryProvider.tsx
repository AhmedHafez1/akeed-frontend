'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * The production `QueryProvider` watches Supabase auth, which the fixture's
 * replacement auth module does not provide. The fixture needs only the cache:
 * one client per page load, no retries, so a scripted failure shows at once.
 */
export function FixtureQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
