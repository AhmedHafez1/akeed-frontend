import 'server-only'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('PublicStats')
const STATS_REVALIDATE_SECONDS = 600
const STATS_TIMEOUT_MS = 3000

interface PublicStatsResponse {
  confirmed_orders_total?: unknown
}

/**
 * Orders customers confirmed through Akeed, or null when the backend cannot
 * say: the homepage then hides the counter rather than show a guess.
 */
export async function getConfirmedOrdersTotal(): Promise<number | null> {
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
    const total = body.confirmed_orders_total
    return typeof total === 'number' && Number.isInteger(total) && total >= 0
      ? total
      : null
  } catch (error) {
    logger.warn('Stats request failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
