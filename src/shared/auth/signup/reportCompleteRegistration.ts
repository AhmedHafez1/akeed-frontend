import { api } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import {
  newMetaEventId,
  readMetaBrowserIds,
  trackMetaEvent,
} from '@/shared/lib/metaPixel'

const logger = createLogger('Signup')

export const COMPLETE_REGISTRATION_EVENT = 'CompleteRegistration'
export const COMPLETE_REGISTRATION_PATH =
  '/api/marketing-events/complete-registration'

/**
 * Reports a created account to Meta twice under one event ID: from the
 * browser Pixel and, through the backend, from the Conversions API, so Meta
 * counts it once. The backend reads the email itself from the account; the
 * page sends only IDs. Nothing here is awaited or allowed to throw: tracking
 * never stands between a merchant and their new account.
 */
export function reportCompleteRegistration(userId: string): void {
  try {
    const eventId = newMetaEventId()
    trackMetaEvent(COMPLETE_REGISTRATION_EVENT, eventId)

    // The query string can carry the email on later screens; the path is enough.
    const { origin, pathname } = window.location
    void api
      .post(
        COMPLETE_REGISTRATION_PATH,
        {
          eventId,
          userId,
          eventSourceUrl: `${origin}${pathname}`,
          ...readMetaBrowserIds(),
        },
        { keepalive: true }
      )
      .catch(() => {
        logger.warn('CompleteRegistration server event failed')
      })
  } catch {
    logger.warn('CompleteRegistration tracking failed')
  }
}
