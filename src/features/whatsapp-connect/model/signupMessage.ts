/**
 * Embedded Signup's session messages, read defensively.
 *
 * Meta posts them from its signup window with `postMessage`. Its sample
 * accepts any origin ending in `facebook.com`, which also accepts
 * `evilfacebook.com`; here the origin must be exactly one of Meta's hosts
 * over HTTPS. Every id is only a hint: the server checks it against the token
 * Meta issues and never trusts it on its own.
 */

/** Meta's hosts that open the signup window. */
export const TRUSTED_FACEBOOK_HOSTNAMES: ReadonlySet<string> = new Set([
  'www.facebook.com',
  'web.facebook.com',
  'business.facebook.com',
])

export function isTrustedFacebookOrigin(origin: unknown): boolean {
  if (typeof origin !== 'string') return false
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }
  return (
    url.protocol === 'https:' &&
    url.port === '' &&
    url.origin === origin &&
    TRUSTED_FACEBOOK_HOSTNAMES.has(url.hostname)
  )
}

/** What the server accepts as hints; the shape of the completion request. */
export interface SignupSessionHints {
  wabaIds: string[]
  phoneNumberId: string | null
  isOnBusinessApp: boolean | null
}

export type SignupMessage =
  | { kind: 'finish'; hints: SignupSessionHints }
  | { kind: 'cancel' }
  | { kind: 'error'; errorCode: string | null }

const META_ID = /^\d{1,32}$/
const MAX_IDS = 10
const MAX_STRING_PAYLOAD = 16_384

const FINISH_EVENTS: ReadonlySet<string> = new Set([
  'FINISH',
  'FINISH_ONLY_WABA',
  'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
  'FINISH_GRANT_ONLY_API_ACCESS',
])

function metaId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
    return String(value)
  return typeof value === 'string' && META_ID.test(value) ? value : null
}

function metaIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(metaId).filter((id): id is string => id !== null)
}

function readFinish(event: string, data: Record<string, unknown>) {
  // v5: messaging_account_ids. v4: waba_id, plus waba_ids when several.
  const wabaIds = [
    ...new Set([
      ...metaIds(data.messaging_account_ids),
      ...[metaId(data.waba_id)].filter((id): id is string => id !== null),
      ...metaIds(data.waba_ids),
    ]),
  ].slice(0, MAX_IDS)
  const onBusinessApp =
    typeof data.is_on_biz_app === 'boolean'
      ? data.is_on_biz_app
      : event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
        ? true
        : null
  return {
    kind: 'finish' as const,
    hints: {
      wabaIds,
      phoneNumberId: metaId(data.phone_number_id),
      isOnBusinessApp: onBusinessApp,
    },
  }
}

/**
 * The signup message in `data`, or null for anything else: other windows,
 * other message types, malformed payloads. Meta documents a JSON string; an
 * already parsed object is accepted too.
 */
export function parseSignupMessage(data: unknown): SignupMessage | null {
  let payload: unknown = data
  if (typeof data === 'string') {
    if (data.length > MAX_STRING_PAYLOAD) return null
    try {
      payload = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return null
  const { type, event, data: body } = payload as Record<string, unknown>
  if (type !== 'WA_EMBEDDED_SIGNUP' || typeof event !== 'string') return null
  const fields =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {}

  if (FINISH_EVENTS.has(event)) return readFinish(event, fields)
  if (event === 'CANCEL') return { kind: 'cancel' }
  if (event === 'ERROR') {
    const code = fields.error_code
    const errorCode =
      typeof code === 'number' && Number.isSafeInteger(code)
        ? String(code)
        : typeof code === 'string' && /^\d{1,12}$/.test(code)
          ? code
          : null
    return { kind: 'error', errorCode }
  }
  return null
}
