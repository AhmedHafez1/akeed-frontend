import 'server-only'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('PublicStats')
const STATS_REVALIDATE_SECONDS = 600
const STATS_TIMEOUT_MS = 3000

interface PublicStatsResponse {
  confirmed_orders_total?: unknown
  active_stores_total?: unknown
}

export interface PublicStats {
  confirmedOrdersTotal: number
  /** Null when the backend did not count them. */
  activeStoresTotal: number | null
}

const asTotal = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null

/**
 * The homepage's live totals, or null when the backend cannot say how many
 * orders were confirmed: the card is then hidden rather than show a guess.
 */
export async function getPublicStats(): Promise<PublicStats | null> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
  ).replace(/\/+$/, '')

  try {
    const response = await fetch(`${baseUrl}/api/public/stats`, {
      next: { revalidate: STATS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(STATS_TIMEOUT_MS),
    })
    if (!response.ok) {
      logger.warn('Stats request failed', { status: response.status })
      return null
    }
    const body = (await response.json()) as PublicStatsResponse
    const confirmedOrdersTotal = asTotal(body.confirmed_orders_total)
    if (confirmedOrdersTotal === null) return null
    return {
      confirmedOrdersTotal,
      activeStoresTotal: asTotal(body.active_stores_total),
    }
  } catch (error) {
    logger.warn('Stats request failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
