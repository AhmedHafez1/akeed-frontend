import { describe, expect, it } from 'vitest'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import { ONBOARDING_STORE_STEP_TITLE } from '@/features/onboarding'
import { resolveSettingsSourceSkin } from './sourceSkins'

function leafKeys(value: unknown, path = ''): string[] {
  if (value === null || typeof value !== 'object') return [path]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, path ? `${path}.${key}` : key)
  )
}

describe('resolveSettingsSourceSkin', () => {
  it.each([
    ['easyorders', 'sourceEasyOrders', 'sourceHelpEasyOrders'],
    ['woocommerce', 'sourceWooCommerce', 'sourceHelpWooCommerce'],
  ])(
    'gives the connected source %s its panel and its health',
    (platformType, nameKey, helpKey) => {
      const skin = resolveSettingsSourceSkin(platformType)

      expect(skin).toMatchObject({ nameKey, helpKey, showsHealth: true })
      expect(skin?.Panel).toBeTypeOf('function')
    }
  )

  it('gives each connected source a panel of its own', () => {
    expect(resolveSettingsSourceSkin('woocommerce')?.Panel).not.toBe(
      resolveSettingsSourceSkin('easyorders')?.Panel
    )
  })

  it('leaves the Standalone source without a panel or health', () => {
    expect(resolveSettingsSourceSkin('standalone')).toEqual({
      nameKey: 'sourceStandalone',
      helpKey: 'sourceHelp',
      showsHealth: false,
    })
  })

  it.each(['shopify', 'salla', '', 'constructor'])(
    'has no skin for %j',
    (platformType) => {
      expect(resolveSettingsSourceSkin(platformType)).toBeNull()
    }
  )

  it.each([
    ['ar', ar],
    ['en', en],
  ] as const)(
    'has a name and help text for every skin in %s',
    (_, messages) => {
      for (const platformType of ['standalone', 'easyorders', 'woocommerce']) {
        const skin = resolveSettingsSourceSkin(platformType)!
        expect(messages.settings[skin.nameKey]).toBeTruthy()
        expect(
          messages.settings.standalone.page.store[skin.helpKey]
        ).toBeTruthy()
      }
    }
  )
})

describe('source setup messages', () => {
  it.each([
    ['the EasyOrders screens', ar.easyOrdersConnect, en.easyOrdersConnect],
    ['the WooCommerce screens', ar.wooCommerceConnect, en.wooCommerceConnect],
    [
      'the connection health',
      ar.settings.standalone.page.store,
      en.settings.standalone.page.store,
    ],
    [
      'the setup blockers',
      ar.standaloneOnboarding.blockers,
      en.standaloneOnboarding.blockers,
    ],
    [
      'the setup steps',
      ar.standaloneOnboarding.flow,
      en.standaloneOnboarding.flow,
    ],
  ])(
    'have the same keys in Arabic and English for %s',
    (_, arabic, english) => {
      expect(leafKeys(arabic).sort()).toEqual(leafKeys(english).sort())
    }
  )

  it('names the middle step of setup for every source skin', () => {
    for (const key of Object.values(ONBOARDING_STORE_STEP_TITLE)) {
      expect(ar.standaloneOnboarding.flow[key]).toBeTruthy()
      expect(en.standaloneOnboarding.flow[key]).toBeTruthy()
    }
  })

  it.each([
    ['ar', ar.easyOrdersConnect],
    ['en', en.easyOrdersConnect],
  ] as const)(
    'promises no instant recovery and shows no credential, in %s',
    (_, messages) => {
      const text = JSON.stringify([
        messages.revoked,
        messages.disconnected,
        messages.disconnect,
        messages.removal,
      ])

      expect(text).not.toMatch(/instant|immediately restored|تلقائيًا تعود/i)
      expect(text).not.toMatch(/eo_[A-Za-z0-9_-]{8,}|v1:/)
    }
  )

  it.each([
    ['ar', ar.wooCommerceConnect],
    ['en', en.wooCommerceConnect],
  ] as const)(
    'promises no recovery of missed orders and shows no credential for WooCommerce, in %s',
    (_, messages) => {
      const text = JSON.stringify([
        messages.credentialsRejected,
        messages.disconnected,
        messages.disconnect,
        messages.removal,
        messages.webhooks,
        messages.check,
      ])

      expect(text).not.toMatch(
        /instant|immediately restored|will be imported|will be recovered|تلقائيًا تعود|سيتم استيراد/i
      )
      expect(text).not.toMatch(/ck_[a-z0-9]{6,}|cs_[a-z0-9]{6,}|v1:|wc-auth/)
      // Wherever a disabled notification or a disconnect is described, the
      // screen says that orders placed meanwhile are not imported.
      for (const sentence of [
        messages.webhooks.disabled.missedOrders,
        messages.webhooks.enabled,
        messages.disconnect.effects.reconnect,
      ])
        expect(sentence).toMatch(/not imported|لا تُستورد/)
    }
  )
})
