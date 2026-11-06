import { ApiError } from '@/shared/lib/http'

/*
 * In-memory WhatsApp sender for the WhatsApp settings tab, in both skins.
 * Synthetic facts only: no Meta call, no real number. `?wa=` picks a state:
 *
 *   unconnected | active (default) | mixed | degraded | sendingOff |
 *   disconnected | offboarded | unavailable | error | loading
 *
 * `role=owner|admin|viewer` sets the permissions, `disconnect=fail` makes
 * disconnecting fail. Disconnecting and the thank-you switch keep their new
 * state for the page's lifetime.
 */

type Scenario =
  | 'unconnected'
  | 'active'
  | 'mixed'
  | 'degraded'
  | 'sendingOff'
  | 'disconnected'
  | 'offboarded'
  | 'unavailable'
  | 'error'
  | 'loading'

const param = (name: string) =>
  typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get(name)

const state = globalThis as typeof globalThis & {
  __akeedWhatsappFixture?: { thankYou: boolean; disconnected: boolean }
}

function memory() {
  state.__akeedWhatsappFixture ??= { thankYou: true, disconnected: false }
  return state.__akeedWhatsappFixture
}

function scenario(): Scenario {
  const value = param('wa') as Scenario | null
  if (memory().disconnected) return 'disconnected'
  return value ?? 'active'
}

function role() {
  const value = param('role')
  return value === 'admin' || value === 'viewer' ? value : 'owner'
}

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString()

function template(
  key: string,
  language: string,
  status = 'approved',
  readiness: { kind: string; reason: string } = {
    kind: 'merchant_own',
    reason: 'own_number',
  }
) {
  return {
    key,
    language,
    languageCode: language,
    status,
    category: 'utility',
    readiness,
  }
}

function availability() {
  const current = scenario()
  const owner = role() === 'owner'
  const alerts =
    current === 'degraded' || current === 'sendingOff'
      ? [
          {
            kind: 'payment',
            reason: 'payment',
            severity: 'critical',
            action: 'whatsapp_manager',
            templates: [],
          },
        ]
      : current === 'offboarded'
        ? [
            {
              kind: 'disconnect',
              reason: 'offboarded',
              severity: 'critical',
              action: 'reconnect',
              templates: [],
            },
          ]
        : []
  const own = {
    kind: 'merchant_own',
    reason: 'own_number',
    acceptedAt: minutesAgo(18),
    deliveryStatus: 'read',
  }
  const akeed = {
    kind: 'akeed_system',
    reason: 'degraded:payment',
    acceptedAt: minutesAgo(14),
    deliveryStatus: 'delivered',
  }
  const confirmation =
    current === 'unconnected' || current === 'mixed'
      ? null
      : current === 'degraded' || current === 'sendingOff'
        ? akeed
        : own
  return {
    available: current !== 'unavailable',
    appId: current === 'unavailable' ? null : '0000000000',
    configId: current === 'unavailable' ? null : '1111111111',
    canConnect: current !== 'unavailable' && owner,
    sendingEnabled: current !== 'sendingOff',
    permissions: {
      canDisconnect: owner,
      canUpdateThankYou: role() !== 'viewer',
    },
    lastAcceptedSend: confirmation,
    lastAccepted: { confirmation, reminder: null },
    alerts,
  }
}

function connection() {
  const current = scenario()
  if (current === 'unconnected' || current === 'unavailable') return null
  const degraded = current === 'degraded' || current === 'sendingOff'
  const details =
    current === 'mixed'
      ? [
          template('cod_confirm.ar.standard', 'ar'),
          template('cod_confirm.en.standard', 'en', 'pending', {
            kind: 'akeed_system',
            reason: 'template_pending',
          }),
          template('cod_reminder.fr.standard', 'fr', 'pending', {
            kind: 'akeed_system',
            reason: 'template_pending',
          }),
        ]
      : [
          template('cod_confirm.ar.standard', 'ar'),
          template('cod_confirm.en.standard', 'en'),
          template('cod_reminder.fr.standard', 'fr'),
        ].map((row) =>
          degraded
            ? {
                ...row,
                readiness: {
                  kind: 'akeed_system',
                  reason:
                    current === 'sendingOff'
                      ? 'feature_off'
                      : 'degraded:payment',
                },
              }
            : row
        )
  return {
    thankYouEnabled: memory().thankYou,
    state:
      current === 'disconnected'
        ? 'disconnected'
        : current === 'offboarded'
          ? 'offboarded'
          : 'active',
    signupPath: 'coexistence',
    displayPhoneNumber: '+20 100 555 0101',
    health: {
      stateReason: null,
      qualityRating: 'GREEN',
      degradedClass: degraded ? 'payment' : null,
      lastCheckedAt: minutesAgo(12),
    },
    setup: {
      status: 'complete',
      step: 'done',
      errorCode: null,
      retryAt: null,
      subscribedAt: minutesAgo(3000),
      numberVerifiedAt: minutesAgo(3000),
      registeredAt: minutesAgo(3000),
      completedAt: minutesAgo(2990),
    },
    templates: {
      total: 3,
      ready: details.filter((row) => row.readiness.kind === 'merchant_own')
        .length,
      pending: details.filter((row) => row.status === 'pending').length,
      rejected: 0,
      recategorized: 0,
      retrying: 0,
      needsStaff: 0,
      drift: 0,
    },
    templateDetails: details,
  }
}

export function isWhatsappSenderUrl(url: string) {
  return url.startsWith('/api/whatsapp-sender')
}

export async function whatsappSenderRequest<T>(
  method: 'GET' | 'PATCH' | 'POST',
  url: string,
  data?: unknown
): Promise<T> {
  const current = scenario()
  if (current === 'loading') return new Promise<T>(() => undefined)
  if (method === 'GET' && current === 'error' && url.endsWith('/connection'))
    throw new ApiError('Synthetic read failure', 500)
  if (method === 'GET' && url === '/api/whatsapp-sender')
    return availability() as T
  if (method === 'GET' && url === '/api/whatsapp-sender/connection')
    return { connection: connection() } as T
  if (method === 'PATCH' && url === '/api/whatsapp-sender/connection') {
    if (role() === 'viewer')
      throw new ApiError('x', 403, 'WHATSAPP_CONNECTION_WRITE_REQUIRED')
    memory().thankYou = Boolean(
      (data as { thankYouEnabled?: boolean } | undefined)?.thankYouEnabled
    )
    return { thankYouEnabled: memory().thankYou } as T
  }
  if (method === 'POST' && url === '/api/whatsapp-sender/disconnect') {
    await new Promise((resolve) => setTimeout(resolve, 600))
    if (param('disconnect') === 'fail')
      throw new ApiError('Synthetic disconnect failure', 500)
    memory().disconnected = true
    return {
      state: 'disconnected',
      providerCleanup: 'succeeded',
      businessAppSteps: [
        'settings',
        'account',
        'business_platform',
        'disconnect',
      ],
    } as T
  }
  throw new Error(`Unexpected WhatsApp fixture ${method}: ${url}`)
}
