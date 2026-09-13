import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'

interface ManualOrderContextResponse {
  page_context?: {
    source?: { status?: string }
    permissions?: { can_create_manual_order?: boolean }
    usage?: {
      limit?: number
      remaining?: number
      credit_denial?: string | null
    }
  }
}

export type ManualOrderAvailability =
  | { status: 'unavailable' }
  | {
      status: 'ready'
      canCreate: boolean
      sourceConnected: boolean
      isAtPlanLimit: boolean
      creditDenial?: string | null
    }

/**
 * Whether the top bar may offer "Verify order".
 *
 * Read from the verifications page context under the shared key, so every
 * order, retry or credit purchase that invalidates verifications also re-gates
 * this button — the last credit spent disables it without a reload.
 */
export function manualOrderAvailabilityOptions() {
  return queryOptions({
    queryKey: queryKeys.verifications.pageContext(),
    queryFn: ({ signal }) =>
      api.get<ManualOrderContextResponse>(
        '/api/verifications?date_range=today&limit=1',
        { signal }
      ),
    select: (response): ManualOrderAvailability => {
      const context = response.page_context
      if (!context) return { status: 'unavailable' }
      return {
        status: 'ready',
        creditDenial: context.usage?.credit_denial,
        canCreate:
          context.permissions?.can_create_manual_order === true &&
          !context.usage?.credit_denial,
        sourceConnected: context.source?.status === 'connected',
        isAtPlanLimit:
          (context.usage?.limit ?? 0) > 0 &&
          (context.usage?.remaining ?? 1) <= 0,
      }
    },
  })
}
