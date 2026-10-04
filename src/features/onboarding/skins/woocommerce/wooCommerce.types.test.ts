import { describe, expect, it } from 'vitest'
import ar from '../../../../../public/messages/ar.json'
import en from '../../../../../public/messages/en.json'
import {
  WOOCOMMERCE_ERROR_CODES,
  WOOCOMMERCE_UNSUPPORTED_STORE_CODES,
  isUnsupportedStoreCode,
  parseWooCommerceReturnHint,
  resolveWooCommerceConnectView,
  toWooCommerceErrorKey,
  type WooCommerceConnectionStatus,
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
