'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getAuthMode, getSupabaseClient } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('QueryProvider')

const MAX_RETRIES = 2

/**
 * A 4xx is the server's answer, not a transient failure: retrying a permission
 * or validation error only delays the message the merchant needs to see.
 * Checked structurally because features throw their own error classes
 * (`ApiError`, `BillingApiError`), all carrying the HTTP status.
 */
function isClientError(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' && status >= 400 && status < 500
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < MAX_RETRIES,
      },
    },
  })
}

/**
 * Drops every cached query when the signed-in standalone user changes.
 *
 * Query keys are not scoped by organization, so a cache that outlived a
 * sign-out would briefly show the previous tenant's orders to the next one.
 * Embedded sessions are bound to one shop per page load and need no reset.
 */
function useResetCacheOnUserChange(queryClient: QueryClient) {
  useEffect(() => {
    if (getAuthMode() !== 'STANDALONE') return

    let unsubscribe: (() => void) | undefined
    try {
      let currentUserId: string | null | undefined
      const {
        data: { subscription },
      } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
        const nextUserId = session?.user.id ?? null
        if (currentUserId !== undefined && currentUserId !== nextUserId) {
          queryClient.clear()
        }
        currentUserId = nextUserId
      })
      unsubscribe = () => subscription.unsubscribe()
    } catch (error) {
      logger.warn('Unable to watch auth state for cache reset', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
    }

    return unsubscribe
  }, [queryClient])
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  useResetCacheOnUserChange(queryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
