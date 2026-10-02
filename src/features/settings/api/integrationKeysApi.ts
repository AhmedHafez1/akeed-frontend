import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'

/** Key metadata. The API never returns the secret or its hash here. */
export interface IntegrationApiKey {
  id: string
  name: string
  /** Non-secret, e.g. `ak_live_ab12cd34`. */
  prefix: string
  status: 'active' | 'revoked'
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export interface IntegrationApiKeyList {
  keys: IntegrationApiKey[]
  /** Active keys one store may hold at a time. */
  maxActive: number
}

/** The only response that ever carries the full key, once. */
export interface CreatedIntegrationApiKey {
  key: IntegrationApiKey
  secret: string
}

const BASE = '/api/integration-keys'

export function integrationKeysOptions(enabled: boolean) {
  return queryOptions({
    queryKey: queryKeys.integrationKeys.list(),
    queryFn: ({ signal }) => api.get<IntegrationApiKeyList>(BASE, { signal }),
    enabled,
  })
}

/**
 * Creates a key. `gcTime: 0` drops the settled mutation, secret included, from
 * the React Query cache as soon as nothing observes it; the dialog also calls
 * `reset()` right after copying the secret into its own state.
 */
export function useCreateIntegrationKeyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      api.post<CreatedIntegrationApiKey>(BASE, { name }),
    gcTime: 0,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrationKeys.all,
      }),
  })
}

export function useRevokeIntegrationKeyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (keyId: string) =>
      api.delete<IntegrationApiKey>(`${BASE}/${encodeURIComponent(keyId)}`),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrationKeys.all,
      }),
  })
}
