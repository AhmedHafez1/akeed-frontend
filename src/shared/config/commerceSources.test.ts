import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadSources(flag: string | undefined) {
  vi.resetModules()
  if (flag === undefined) vi.unstubAllEnvs()
  else vi.stubEnv('NEXT_PUBLIC_EASYORDERS_CONNECT_ENABLED', flag)
  return import('./commerceSources')
}

describe('signup sources', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each([undefined, 'false', 'TRUE', '1'])(
    'offers only Standalone when the EasyOrders switch is %s',
    async (flag) => {
      const { getSignupSources, resolveOrganizationSourceMode } =
        await loadSources(flag)

      expect(getSignupSources()).toEqual([
        { id: 'standalone', organizationSourceMode: 'standalone' },
      ])
      // A choice saved while the switch was on no longer skips Standalone.
      expect(resolveOrganizationSourceMode('easyorders')).toBe('standalone')
    }
  )

  it('adds EasyOrders as a connect source when its switch is on', async () => {
    const { getSignupSources, resolveOrganizationSourceMode } =
      await loadSources('true')

    expect(getSignupSources()).toEqual([
      { id: 'standalone', organizationSourceMode: 'standalone' },
      { id: 'easyorders', organizationSourceMode: 'connect' },
    ])
    expect(resolveOrganizationSourceMode('easyorders')).toBe('connect')
  })

  it.each([
    ['false', false],
    ['true', true],
  ])(
    'offers WooCommerce only when its own switch is on (EasyOrders %s)',
    async (easyOrdersFlag, easyOrdersOn) => {
      vi.stubEnv('NEXT_PUBLIC_WOOCOMMERCE_CONNECT_ENABLED', 'true')
      const { getSignupSources, resolveOrganizationSourceMode } =
        await loadSources(easyOrdersFlag)

      expect(getSignupSources()).toEqual([
        { id: 'standalone', organizationSourceMode: 'standalone' },
        ...(easyOrdersOn
          ? [{ id: 'easyorders', organizationSourceMode: 'connect' }]
          : []),
        { id: 'woocommerce', organizationSourceMode: 'connect' },
      ])
      expect(resolveOrganizationSourceMode('woocommerce')).toBe('connect')
    }
  )

  it('keeps WooCommerce out while its switch is off', async () => {
    vi.stubEnv('NEXT_PUBLIC_WOOCOMMERCE_CONNECT_ENABLED', 'false')
    const { getSignupSources, resolveOrganizationSourceMode } =
      await loadSources('true')

    expect(getSignupSources().map((source) => source.id)).toEqual([
      'standalone',
      'easyorders',
    ])
    expect(resolveOrganizationSourceMode('woocommerce')).toBe('standalone')
  })

  it('lists Shopify and no connected store as start routes with every switch off', async () => {
    const { getStartRoutes } = await loadSources(undefined)

    expect(getStartRoutes()).toEqual([
      { id: 'shopify', kind: 'external' },
      { id: 'standalone', kind: 'signup' },
    ])
  })

  it('puts the switched-on stores between Shopify and no connected store', async () => {
    vi.stubEnv('NEXT_PUBLIC_WOOCOMMERCE_CONNECT_ENABLED', 'true')
    const { getStartRoutes } = await loadSources('true')

    expect(getStartRoutes()).toEqual([
      { id: 'shopify', kind: 'external' },
      { id: 'woocommerce', kind: 'signup' },
      { id: 'easyorders', kind: 'signup' },
      { id: 'standalone', kind: 'signup' },
    ])
  })

  it('leaves a switched-off store out of the start routes', async () => {
    vi.stubEnv('NEXT_PUBLIC_WOOCOMMERCE_CONNECT_ENABLED', 'false')
    const { getStartRoutes } = await loadSources('true')

    expect(getStartRoutes().map((route) => route.id)).toEqual([
      'shopify',
      'easyorders',
      'standalone',
    ])
  })

  it('reads ?source= only for a source offered now', async () => {
    vi.stubEnv('NEXT_PUBLIC_WOOCOMMERCE_CONNECT_ENABLED', 'true')
    const { parseSignupSourceParam } = await loadSources('true')

    expect(parseSignupSourceParam('standalone')).toBe('standalone')
    expect(parseSignupSourceParam('easyorders')).toBe('easyorders')
    expect(parseSignupSourceParam('woocommerce')).toBe('woocommerce')
  })

  it.each([
    undefined,
    null,
    '',
    'shopify',
    'Standalone',
    'x',
    42,
    ['easyorders'],
  ])('ignores the ?source= value %p', async (value) => {
    const { parseSignupSourceParam } = await loadSources('true')

    expect(parseSignupSourceParam(value)).toBeNull()
  })

  it('ignores ?source= for a switched-off store', async () => {
    const { parseSignupSourceParam } = await loadSources(undefined)

    expect(parseSignupSourceParam('easyorders')).toBeNull()
    expect(parseSignupSourceParam('woocommerce')).toBeNull()
    expect(parseSignupSourceParam('standalone')).toBe('standalone')
  })

  it.each([undefined, null, '', 'standalone', 'shopify', 42, { id: 'x' }])(
    'provisions Standalone for the saved choice %p',
    async (saved) => {
      const { resolveOrganizationSourceMode } = await loadSources('true')

      expect(resolveOrganizationSourceMode(saved)).toBe('standalone')
    }
  )
})
