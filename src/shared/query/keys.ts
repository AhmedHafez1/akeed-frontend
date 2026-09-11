/**
 * The one namespace every screen reads server state from.
 *
 * Keys are hierarchical so a prefix addresses a whole family: invalidating
 * `verifications.all` reaches every list, every stats range and the page
 * context at once. Features never build a key by hand — if two screens show
 * the same data they must meet here, or an invalidation will miss one of them.
 */
export const queryKeys = {
  verifications: {
    all: ['verifications'] as const,
    lists: () => [...queryKeys.verifications.all, 'list'] as const,
    list: (filters: { status: string; dateRange: string }) =>
      [...queryKeys.verifications.lists(), filters] as const,
    stats: (dateRange: string) =>
      [...queryKeys.verifications.all, 'stats', dateRange] as const,
    pageContext: () =>
      [...queryKeys.verifications.all, 'page-context'] as const,
  },
  billing: {
    all: ['billing'] as const,
    summary: () => [...queryKeys.billing.all, 'summary'] as const,
    ledger: () => [...queryKeys.billing.all, 'ledger'] as const,
    purchases: () => [...queryKeys.billing.all, 'purchases'] as const,
  },
  orders: {
    /**
     * What has been observed on the server for each just-created order.
     *
     * Deliberately outside `verifications`: each observation invalidates that
     * whole family, and must not cancel the very read that made it.
     */
    tracking: () => ['orders', 'tracking'] as const,
  },
}

/**
 * Mutations other screens need to observe while they are in flight.
 *
 * Creating an order is read back by the dashboard through `useMutationState`,
 * which is how a pending row reaches the table without the order dialog and
 * the dashboard importing each other.
 */
export const mutationKeys = {
  createManualOrder: ['orders', 'create'] as const,
}
