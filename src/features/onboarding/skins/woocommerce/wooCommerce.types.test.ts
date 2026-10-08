import { describe, expect, it } from 'vitest'
import ar from '../../../../../public/messages/ar.json'
import en from '../../../../../public/messages/en.json'
import {
  WOOCOMMERCE_CHECK_PROBLEMS,
  WOOCOMMERCE_ERROR_CODES,
  WOOCOMMERCE_UNSUPPORTED_STORE_CODES,
  buildWooCommerceChecklist,
  displayStoreAddress,
  isUnnamedWooCommerceError,
  isUnsupportedStoreCode,
  parseWooCommerceReturnHint,
  resolveWooCommerceConnectView,
  toStoreAddress,
  toWooCommerceCheckKey,
  toWooCommerceErrorKey,
  type WooCommerceConnectionDetails,
  type WooCommerceConnectionStatus,
  type WooCommerceWebhookState,
} from './wooCommerce.types'

function leafKeys(value: unknown, path = ''): string[] {
  if (value === null || typeof value !== 'object') return [path]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, path ? `${path}.${key}` : key)
  )
}

function status(
  overrides: Partial<WooCommerceConnectionStatus> = {}
): WooCommerceConnectionStatus {
  return {
    state: 'ready',
    canManage: true,
    organizationName: 'متجر نور',
    storeUrl: null,
    expiresAt: null,
    lastErrorCode: null,
    connection: null,
    ...overrides,
  }
}

const idle = {
  isLoading: false,
  loadFailed: false,
  returnHint: null,
  restarting: false,
} as const

describe('WooCommerce messages (US-07-02)', () => {
  it.each(Object.entries({ ar, en }))(
    '%s has a message for every code the screen names, and a default',
    (_locale, messages) => {
      const codes: Record<string, string> = messages.wooCommerceConnect.codes

      for (const code of [...WOOCOMMERCE_ERROR_CODES, 'default'])
        expect(codes[code]?.trim(), code).toBeTruthy()
      expect(Object.keys(codes).sort()).toEqual(
        [...WOOCOMMERCE_ERROR_CODES, 'default'].sort()
      )
    }
  )

  it('gives Arabic and English the same WooCommerce keys', () => {
    expect(leafKeys(ar.wooCommerceConnect).sort()).toEqual(
      leafKeys(en.wooCommerceConnect).sort()
    )
    expect(leafKeys(ar.auth.signup.source.options.woocommerce)).toEqual(
      leafKeys(en.auth.signup.source.options.woocommerce)
    )
  })

  it('never leaves an Arabic code message in English', () => {
    const arabic = ar.wooCommerceConnect.codes as Record<string, string>
    const english = en.wooCommerceConnect.codes as Record<string, string>

    for (const code of [...WOOCOMMERCE_ERROR_CODES, 'default'])
      expect(arabic[code], code).not.toBe(english[code])
  })

  it('shows the default for a code the screen does not name', () => {
    for (const code of [
      'WOOCOMMERCE_INSTALL_CONTEXT_INVALID',
      'WOOCOMMERCE_INGESTION_UNAVAILABLE',
      'EASYORDERS_KEY_REJECTED',
      null,
      undefined,
    ])
      expect(toWooCommerceErrorKey(code)).toBe('default')
  })

  it('treats every support-boundary code as an unsupported store, and nothing else', () => {
    for (const code of WOOCOMMERCE_UNSUPPORTED_STORE_CODES)
      expect(isUnsupportedStoreCode(code)).toBe(true)
    for (const code of [
      'WOOCOMMERCE_PROVIDER_UNAVAILABLE',
      'WOOCOMMERCE_SOURCE_EXISTS',
      'WOOCOMMERCE_PILOT_REQUIRED',
      null,
    ])
      expect(isUnsupportedStoreCode(code)).toBe(false)
  })
})

/**
 * Every code `woocommerce.errors.ts` in the backend can answer with, as of
 * the US-07-06 release gate. A code added there needs a row here, and with it
 * a decision: its own message, or the default.
 */
const BACKEND_ERROR_CODES = [
  'WOOCOMMERCE_CONNECT_UNAVAILABLE',
  'WOOCOMMERCE_PILOT_REQUIRED',
  'WOOCOMMERCE_SESSION_REQUIRED',
  'WOOCOMMERCE_ROLE_REQUIRED',
  'WOOCOMMERCE_SOURCE_EXISTS',
  'WOOCOMMERCE_INSTALL_VALIDATION_FAILED',
  'WOOCOMMERCE_INSTALL_CONTEXT_INVALID',
  'WOOCOMMERCE_CALLBACK_INVALID',
  'WOOCOMMERCE_PROVIDER_UNAVAILABLE',
  'WOOCOMMERCE_STORE_URL_INVALID',
  'WOOCOMMERCE_STORE_HTTPS_REQUIRED',
  'WOOCOMMERCE_STORE_ADDRESS_NOT_PUBLIC',
  'WOOCOMMERCE_STORE_REDIRECTS',
  'WOOCOMMERCE_STORE_TLS_FAILED',
  'WOOCOMMERCE_REST_NOT_FOUND',
  'WOOCOMMERCE_REST_UNREACHABLE',
  'WOOCOMMERCE_CREDENTIALS_REJECTED',
  'WOOCOMMERCE_PERMISSION_DENIED',
  'WOOCOMMERCE_STORE_URL_MISMATCH',
  'WOOCOMMERCE_WEBHOOK_SETUP_FAILED',
  'WOOCOMMERCE_STORE_UNAVAILABLE',
  'WOOCOMMERCE_INGESTION_UNAVAILABLE',
  'WOOCOMMERCE_WEBHOOK_UNAUTHORIZED',
  'WOOCOMMERCE_NOT_CONNECTED',
  'WOOCOMMERCE_RECONNECT_STORE_MISMATCH',
  'WOOCOMMERCE_WEBHOOK_MISSING',
  'WOOCOMMERCE_WEBHOOK_DISABLED',
  'WOOCOMMERCE_WEBHOOK_PAUSED',
  'WOOCOMMERCE_WEBHOOK_ENABLE_UNAVAILABLE',
  'WOOCOMMERCE_WEBHOOK_ENABLE_FAILED',
] as const

/**
 * Codes no merchant screen is ever told: the delivery address answers a
 * store with them, the install callback answers the store, and a Shopify
 * session has no WooCommerce screen. They show the localized default.
 */
const CODES_NO_SCREEN_RECEIVES = [
  'WOOCOMMERCE_INGESTION_UNAVAILABLE',
  'WOOCOMMERCE_INSTALL_CONTEXT_INVALID',
  'WOOCOMMERCE_SESSION_REQUIRED',
  'WOOCOMMERCE_WEBHOOK_UNAUTHORIZED',
]

describe('every WooCommerce error code, in both languages (US-07-06)', () => {
  type Messages = typeof en.wooCommerceConnect

  /** The message a merchant reads for a code, wherever the code can show. */
  function messagesFor(code: string, messages: Messages): string[] {
    const codes: Record<string, string> = messages.codes
    const problems: Record<string, string> = messages.check.problems
    const own = [
      toWooCommerceErrorKey(code) === 'default' ? null : codes[code],
      toWooCommerceCheckKey(code) === 'default' ? null : problems[code],
    ].filter((text): text is string => typeof text === 'string')
    return own.length > 0 ? own : [codes.default]
  }

  it('has a message of its own for every code a merchant can be shown', () => {
    const withoutOne = BACKEND_ERROR_CODES.filter(
      (code) =>
        toWooCommerceErrorKey(code) === 'default' &&
        toWooCommerceCheckKey(code) === 'default'
    )

    expect([...withoutOne].sort()).toEqual([...CODES_NO_SCREEN_RECEIVES].sort())
  })

  it.each(BACKEND_ERROR_CODES)(
    '%s reads as a sentence in Arabic and in English, and not the same one',
    (code) => {
      const arabic = messagesFor(code, ar.wooCommerceConnect)
      const english = messagesFor(code, en.wooCommerceConnect)

      expect(arabic).toHaveLength(english.length)
      for (const [index, text] of arabic.entries()) {
        expect(text.trim()).not.toBe('')
        expect(english[index].trim()).not.toBe('')
        expect(text).not.toBe(english[index])
        // A message is words, never the code itself.
        expect(text).not.toContain('WOOCOMMERCE_')
        expect(english[index]).not.toContain('WOOCOMMERCE_')
        expect(text).toMatch(/[\u0600-\u06FF]/)
      }
    }
  )

  it('names no code the backend does not have', () => {
    const backend: readonly string[] = BACKEND_ERROR_CODES

    for (const code of [
      ...WOOCOMMERCE_ERROR_CODES,
      ...WOOCOMMERCE_CHECK_PROBLEMS,
    ])
      expect(backend, code).toContain(code)
  })
})

describe('parseWooCommerceReturnHint', () => {
  it.each([
    ['?success=1&user_id=482910573629104', 'approved'],
    ['?success=0&user_id=482910573629104', 'denied'],
    // The page works the same without user_id.
    ['?success=0', 'denied'],
    ['?success=true', null],
    ['?user_id=1', null],
    ['', null],
  ])('reads %j as %s', (search, hint) => {
    expect(parseWooCommerceReturnHint(search)).toBe(hint)
  })
})

describe('resolveWooCommerceConnectView', () => {
  it.each([
    ['nothing loaded yet', null, { isLoading: true }, 'loading'],
    ['a failed load', null, { loadFailed: true }, 'loadError'],
    ['a fresh organization', status(), {}, 'enterUrl'],
    ['the switch off', status({ state: 'unavailable' }), {}, 'unavailable'],
    ['not approved', status({ state: 'pilot_required' }), {}, 'pilotRequired'],
    ['another source', status({ state: 'source_exists' }), {}, 'sourceExists'],
    ['an open request', status({ state: 'pending' }), {}, 'waiting'],
    [
      'back from the store, approved',
      status({ state: 'pending' }),
      { returnHint: 'approved' },
      'waiting',
    ],
    [
      'back from the store, denied',
      status({ state: 'pending' }),
      { returnHint: 'denied' },
      'denied',
    ],
    [
      'a store the record cannot support',
      status({
        state: 'failed',
        lastErrorCode: 'WOOCOMMERCE_CREDENTIALS_REJECTED',
      }),
      {},
      'unsupported',
    ],
    [
      'any other refusal',
      status({
        state: 'failed',
        lastErrorCode: 'WOOCOMMERCE_PROVIDER_UNAVAILABLE',
      }),
      {},
      'error',
    ],
    ['an expired request', status({ state: 'expired' }), {}, 'error'],
    [
      'starting again after a refusal',
      status({ state: 'failed', lastErrorCode: 'WOOCOMMERCE_REST_NOT_FOUND' }),
      { restarting: true },
      'enterUrl',
    ],
  ] as const)('shows %s as %s', (_label, current, options, view) => {
    expect(
      resolveWooCommerceConnectView(current, { ...idle, ...options })
    ).toBe(view)
  })

  it('a success hint never shows a connection that does not exist', () => {
    expect(
      resolveWooCommerceConnectView(status(), {
        ...idle,
        returnHint: 'approved',
      })
    ).toBe('enterUrl')
  })

  it('starting again never hides a connection that exists', () => {
    expect(
      resolveWooCommerceConnectView(status({ state: 'connected' }), {
        ...idle,
        restarting: true,
        returnHint: 'denied',
      })
    ).toBe('connected')
  })
})

describe('toStoreAddress', () => {
  it.each([
    ['shop.example.com', 'https://shop.example.com'],
    ['  shop.example.com/eg  ', 'https://shop.example.com/eg'],
    ['https://shop.example.com', 'https://shop.example.com'],
    // Sent as typed, so the API answers it with the HTTPS message.
    ['http://shop.example.com', 'http://shop.example.com'],
    ['HTTPS://Shop.example.com', 'HTTPS://Shop.example.com'],
  ])('reads %j as %s', (typed, address) => {
    expect(toStoreAddress(typed)).toBe(address)
  })
})

describe('displayStoreAddress', () => {
  it.each([
    ['https://shop.example.com', 'shop.example.com'],
    ['https://shop.example.com/eg/', 'shop.example.com/eg'],
    ['Shop.Example.com', 'shop.example.com'],
    ['shop', null],
    ['https://', null],
    ['', null],
    ['   ', null],
    [null, null],
    [undefined, null],
  ])('names %j as %s', (address, shown) => {
    expect(displayStoreAddress(address)).toBe(shown)
  })
})

function details(
  overrides: Partial<WooCommerceConnectionDetails> = {}
): WooCommerceConnectionDetails {
  return {
    storeUrl: 'https://shop.example.com',
    health: 'ok',
    connectedAt: '2026-10-04T10:00:00.000Z',
    rejectedDeliveries: 0,
    webhooks: [
      { kind: 'order_created', state: 'active' },
      { kind: 'order_updated', state: 'active' },
    ],
    webhooksCheckedAt: '2026-10-04T10:00:00.000Z',
    disconnectedAt: null,
    ...overrides,
  }
}

describe('WooCommerce messages (US-07-05)', () => {
  it.each(Object.entries({ ar, en }))(
    '%s has guidance for every problem a connection check can find, and a default',
    (_locale, messages) => {
      const problems: Record<string, string> =
        messages.wooCommerceConnect.check.problems

      expect(Object.keys(problems).sort()).toEqual(
        [...WOOCOMMERCE_CHECK_PROBLEMS, 'default'].sort()
      )
      for (const text of Object.values(problems))
        expect(text.trim()).toBeTruthy()
    }
  )

  it('gives each problem its own guidance: no two read the same', () => {
    for (const messages of [ar, en]) {
      const texts = Object.values(
        messages.wooCommerceConnect.check.problems as Record<string, string>
      )
      expect(new Set(texts).size).toBe(texts.length)
    }
  })

  it('never leaves Arabic check guidance in English', () => {
    const arabic = ar.wooCommerceConnect.check.problems as Record<
      string,
      string
    >
    const english = en.wooCommerceConnect.check.problems as Record<
      string,
      string
    >

    for (const code of [...WOOCOMMERCE_CHECK_PROBLEMS, 'default'])
      expect(arabic[code], code).not.toBe(english[code])
  })

  it.each(Object.entries({ ar, en }))(
    '%s names every webhook state and webhook kind',
    (_locale, messages) => {
      const woo = messages.wooCommerceConnect
      const states: Record<string, string> = woo.webhooks.states
      const health = messages.settings.standalone.page.store.health.webhooks

      for (const state of [
        'active',
        'paused',
        'disabled',
        'missing',
        'unknown',
      ]) {
        expect(states[state]).toBeTruthy()
        expect((health.states as Record<string, string>)[state]).toBeTruthy()
        expect((health.notes as Record<string, string>)[state]).toBeTruthy()
      }
      for (const kind of ['order_created', 'order_updated']) {
        expect(
          (woo.webhooks.kinds as Record<string, string>)[kind]
        ).toBeTruthy()
        expect((health.kinds as Record<string, string>)[kind]).toBeTruthy()
      }
      expect(
        messages.standaloneOnboarding.blockers.webhook_disabled
      ).toBeTruthy()
    }
  )

  it('keeps check guidance apart from the connect codes', () => {
    expect(toWooCommerceCheckKey('WOOCOMMERCE_WEBHOOK_PAUSED')).toBe(
      'WOOCOMMERCE_WEBHOOK_PAUSED'
    )
    for (const code of ['WOOCOMMERCE_SOURCE_EXISTS', 'SOMETHING_NEW', null])
      expect(toWooCommerceCheckKey(code)).toBe('default')
  })

  it('tells a code with its own message from one without', () => {
    expect(isUnnamedWooCommerceError('WOOCOMMERCE_NOT_CONNECTED')).toBe(false)
    for (const code of ['UNAVAILABLE', 'WOOCOMMERCE_WEBHOOK_PAUSED', null])
      expect(isUnnamedWooCommerceError(code)).toBe(true)
  })
})

describe('resolveWooCommerceConnectView (US-07-05)', () => {
  const disconnectedAt = '2026-10-05T09:00:00.000Z'

  it.each([
    [
      'a connected store',
      status({ state: 'connected', connection: details() }),
      {},
      'connected',
    ],
    [
      'keys the store rejected',
      status({
        state: 'connected',
        connection: details({ health: 'credentials_rejected' }),
      }),
      {},
      'credentialsRejected',
    ],
    [
      'a permission the store denied',
      status({
        state: 'connected',
        connection: details({ health: 'permission_denied' }),
      }),
      {},
      'credentialsRejected',
    ],
    [
      'a disconnected source',
      status({
        state: 'disconnected',
        connection: details({ webhooks: [], disconnectedAt }),
      }),
      {},
      'disconnected',
    ],
    [
      'a reconnect waiting for the store',
      status({
        state: 'pending',
        connection: details({ webhooks: [], disconnectedAt }),
      }),
      {},
      'waiting',
    ],
    [
      'a refused reconnect',
      status({
        state: 'failed',
        lastErrorCode: 'WOOCOMMERCE_STORE_UNAVAILABLE',
        connection: details({ webhooks: [], disconnectedAt }),
      }),
      {},
      'unsupported',
    ],
    [
      'starting a reconnect again: there is no address to enter',
      status({
        state: 'failed',
        lastErrorCode: 'WOOCOMMERCE_STORE_UNAVAILABLE',
        connection: details({ webhooks: [], disconnectedAt }),
      }),
      { restarting: true },
      'disconnected',
    ],
    [
      'an expired reconnect, started again',
      status({
        state: 'expired',
        connection: details({ webhooks: [], disconnectedAt }),
      }),
      { restarting: true },
      'disconnected',
    ],
  ] as const)('shows %s as %s', (_label, current, options, view) => {
    expect(
      resolveWooCommerceConnectView(current, { ...idle, ...options })
    ).toBe(view)
  })
})

describe('buildWooCommerceChecklist', () => {
  const webhooks = (
    created: WooCommerceWebhookState,
    updated: WooCommerceWebhookState
  ) =>
    details({
      webhooks: [
        { kind: 'order_created', state: created },
        { kind: 'order_updated', state: updated },
      ],
    })
  const doneOf = (
    connection: WooCommerceConnectionDetails,
    sender: 'configured' | 'not_configured' | 'unknown' = 'configured'
  ) =>
    Object.fromEntries(
      buildWooCommerceChecklist(connection, sender).map((item) => [
        item.id,
        item.done,
      ])
    )

  it('asks for the store, its notifications and the sender: no currency and no country', () => {
    expect(
      buildWooCommerceChecklist(details(), 'configured').map((item) => item.id)
    ).toEqual(['store', 'notifications', 'sender'])
    expect(doneOf(details())).toEqual({
      store: true,
      notifications: true,
      sender: true,
    })
  })

  it.each([
    ['disabled', 'active', false],
    ['active', 'disabled', false],
    // Shown and explained on the screen, but the backend does not block
    // setup on them, so neither does the checklist.
    ['paused', 'active', true],
    ['missing', 'active', true],
    ['unknown', 'unknown', true],
  ] as const)(
    'with notifications %s and %s, the row is done: %s',
    (created, updated, done) => {
      expect(doneOf(webhooks(created, updated)).notifications).toBe(done)
    }
  )

  it.each([
    ['configured', true],
    ['unknown', true],
    ['not_configured', false],
  ] as const)('holds setup for a sender that is %s: %s', (sender, done) => {
    expect(doneOf(details(), sender).sender).toBe(done)
  })
})
