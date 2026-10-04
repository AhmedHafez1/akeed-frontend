import { describe, expect, it } from 'vitest'
import { resolveOnboardingSourceSkin } from './useOnboardingSourceSkin'

describe('resolveOnboardingSourceSkin', () => {
  it.each([
    // Nothing read yet: the Standalone page loads and reports for itself.
    [null, 'standalone'],
    [{ platformType: 'standalone' }, 'standalone'],
    [{ platformType: 'shopify' }, 'standalone'],
    [{ platformType: 'woocommerce' }, 'standalone'],
    // Chose a store platform at signup and has not connected it yet.
    ['missing', 'easyorders'],
    // Connected: the same skin shows the connection and its next step.
    [{ platformType: 'easyorders' }, 'easyorders'],
  ] as const)('%j uses the %s skin', (source, skin) => {
    expect(resolveOnboardingSourceSkin(source)).toBe(skin)
  })

  it.each([
    [null, 'easyorders'],
    ['easyorders', 'easyorders'],
    // Not a platform with a connect skin; the guard would not let it here.
    ['standalone', 'easyorders'],
    ['toString', 'easyorders'],
    ['__proto__', 'easyorders'],
  ] as const)(
    'gives a source-less organization that chose %j the %s skin',
    (signupSource, skin) => {
      expect(resolveOnboardingSourceSkin('missing', signupSource)).toBe(skin)
    }
  )

  it('decides by the platform once a source exists, whatever signup chose', () => {
    expect(
      resolveOnboardingSourceSkin({ platformType: 'standalone' }, 'easyorders')
    ).toBe('standalone')
  })
})
