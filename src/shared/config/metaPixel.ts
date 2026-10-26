/** "Akeed Pixel": the ads account's production dataset. */
export const PRODUCTION_META_PIXEL_ID = '2079384036148209'
/** "Akeed - Dev": localhost and preview traffic, kept out of the ad data. */
export const DEV_META_PIXEL_ID = '999653349077771'

/**
 * `NEXT_PUBLIC_META_PIXEL_ID` wins. Unset, only a Vercel production build
 * reports to the production Pixel, so a forgotten variable on a preview or a
 * laptop never pollutes the data the ads optimise on.
 */
export function resolveMetaPixelId(
  configured: string | undefined,
  vercelEnv: string | undefined
): string {
  const trimmed = configured?.trim()
  if (trimmed) return trimmed
  return vercelEnv === 'production'
    ? PRODUCTION_META_PIXEL_ID
    : DEV_META_PIXEL_ID
}

export const META_PIXEL_ID = resolveMetaPixelId(
  process.env.NEXT_PUBLIC_META_PIXEL_ID,
  process.env.NEXT_PUBLIC_VERCEL_ENV
)
