import 'server-only'
import { cache } from 'react'
import { createLogger } from '@/shared/lib/logger'
import {
  isTrackingCode,
  parseShippingTrackingView,
  type ShippingTrackingView,
} from '../model/shippingTracking.model'

const logger = createLogger('ShippingTracking')
const TRACKING_TIMEOUT_MS = 4000

/**
 * What a Track order code opens. Called by the layout and the page of one
 * request, so it is cached for that request: the backend is asked once.
 * Any failure reads as unavailable; the code itself is never logged.
 */
export const getShippingTrackingView = cache(
  async (code: string): Promise<ShippingTrackingView> => {
    if (!isTrackingCode(code)) return { kind: 'unavailable' }
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
    ).replace(/\/+$/, '')

    try {
      const response = await fetch(
        `${baseUrl}/api/public/shipping-tracking/${encodeURIComponent(code)}`,
        { cache: 'no-store', signal: AbortSignal.timeout(TRACKING_TIMEOUT_MS) }
      )
      if (!response.ok) {
        logger.warn('Tracking request failed', { status: response.status })
        return { kind: 'unavailable' }
      }
      return parseShippingTrackingView(await response.json())
    } catch (error) {
      logger.warn('Tracking request failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      return { kind: 'unavailable' }
    }
  }
)
