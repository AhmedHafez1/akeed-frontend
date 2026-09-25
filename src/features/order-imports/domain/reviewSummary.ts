import type { OrderImportCounts } from '../api/orderImportsApi'

/**
 * Counts after the merchant includes or excludes one possible duplicate,
 * shown at once while the server confirms (the server's counts win).
 */
export function countsAfterInclude(
  counts: OrderImportCounts,
  include: boolean
): OrderImportCounts {
  const [from, to] = include
    ? (['excluded', 'ready'] as const)
    : (['ready', 'excluded'] as const)
  return {
    ...counts,
    [from]: Math.max(0, (counts[from] ?? 0) - 1),
    [to]: (counts[to] ?? 0) + 1,
  }
}
