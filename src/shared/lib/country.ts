const REGION_CODE = /^[A-Z]{2}$/

/** `Guatemala` for `GT`; the code itself when the runtime has no name for it. */
export function countryName(
  code: string | null | undefined,
  locale = 'en'
): string | null {
  const region = code?.trim().toUpperCase()
  if (!region || !REGION_CODE.test(region)) return null
  try {
    return (
      new Intl.DisplayNames([locale], { type: 'region' }).of(region) ?? region
    )
  } catch {
    return region
  }
}
