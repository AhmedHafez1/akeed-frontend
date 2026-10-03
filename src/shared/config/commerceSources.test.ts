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

  it.each([undefined, null, '', 'standalone', 'shopify', 42, { id: 'x' }])(
    'provisions Standalone for the saved choice %p',
    async (saved) => {
      const { resolveOrganizationSourceMode } = await loadSources('true')

      expect(resolveOrganizationSourceMode(saved)).toBe('standalone')
    }
  )
})
