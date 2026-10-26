import { describe, expect, it } from 'vitest'
import {
  DEV_META_PIXEL_ID,
  PRODUCTION_META_PIXEL_ID,
  resolveMetaPixelId,
} from './metaPixel'

describe('resolveMetaPixelId', () => {
  it('uses the configured Pixel wherever it is set', () => {
    expect(resolveMetaPixelId(' 123 ', 'preview')).toBe('123')
    expect(resolveMetaPixelId('123', 'production')).toBe('123')
  })

  it('falls back to the production Pixel only on a Vercel production build', () => {
    expect(resolveMetaPixelId(undefined, 'production')).toBe(
      PRODUCTION_META_PIXEL_ID
    )
  })

  it.each([undefined, 'preview', 'development'])(
    'falls back to the dev Pixel for %s',
    (vercelEnv) => {
      expect(resolveMetaPixelId('', vercelEnv)).toBe(DEV_META_PIXEL_ID)
    }
  )
})
