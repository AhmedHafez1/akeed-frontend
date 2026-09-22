import type {
  OrderImportCounts,
  OrderImportRow,
  OrderImportRowOutcome,
} from '../api/orderImportsApi'

/** The outcomes the review tabs filter by, in tile order (story AC5). */
export const reviewOutcomes = [
  'ready',
  'invalid',
  'duplicate',
  'excluded',
] as const satisfies readonly OrderImportRowOutcome[]

export type ReviewOutcome = (typeof reviewOutcomes)[number]

export function isReviewOutcome(value: string | null): value is ReviewOutcome {
  return reviewOutcomes.includes(value as ReviewOutcome)
}

export function countOf(
  counts: OrderImportCounts,
  outcome: ReviewOutcome
): number {
  return counts[outcome] ?? 0
}

/** The tab to open first: what needs attention, else what is ready. */
export function initialReviewOutcome(counts: OrderImportCounts): ReviewOutcome {
  if (countOf(counts, 'invalid') > 0) return 'invalid'
  return 'ready'
}

/**
 * Counts after the merchant includes or excludes one possible duplicate,
 * shown at once while the server confirms (the server's counts win).
 */
export function countsAfterInclude(
  counts: OrderImportCounts,
  include: boolean
): OrderImportCounts {
  const [from, to]: ReviewOutcome[] = include
    ? ['excluded', 'ready']
    : ['ready', 'excluded']
  return {
    ...counts,
    [from]: Math.max(0, countOf(counts, from) - 1),
    [to]: countOf(counts, to) + 1,
  }
}

/** A row whose only problem is a possible duplicate can be included. */
export function isIncludable(row: OrderImportRow): boolean {
  const blocking = row.issues.filter((issue) => !issue.informational)
  return (
    blocking.length > 0 &&
    blocking.every((issue) => issue.code === 'POSSIBLE_DUPLICATE')
  )
}
