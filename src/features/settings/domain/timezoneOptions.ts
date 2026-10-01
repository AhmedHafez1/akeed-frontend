/**
 * The zones the quiet-hours select offers, in both skins. The list is curated
 * for the markets Akeed serves; a Shopify store's own zone and a saved zone
 * outside the list are added so neither is ever lost.
 */

export const CURATED_TIMEZONES = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Qatar',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Muscat',
  'Asia/Amman',
  'Africa/Cairo',
  'Africa/Casablanca',
  'UTC',
] as const

export type CuratedTimezone = (typeof CURATED_TIMEZONES)[number]

export function isCuratedTimezone(zone: string): zone is CuratedTimezone {
  return (CURATED_TIMEZONES as readonly string[]).includes(zone)
}

/** A readable place name for an IANA zone outside the curated list. */
export function timezonePlaceName(zone: string): string {
  return (zone.split('/').pop() ?? zone).replaceAll('_', ' ')
}

export interface TimezoneOption {
  value: string
  label: string
}

/**
 * The select's options: the store's own zone first (marked as store time),
 * then the curated list, then the current value when it is in neither.
 */
export function buildTimezoneOptions(params: {
  shopTimezone: string | null | undefined
  currentTimezone: string | null | undefined
  /** The translated name of a curated zone. */
  curatedLabel: (zone: CuratedTimezone) => string
  /** Wraps the store zone's name, e.g. "Cairo (store time)". */
  storeTimeLabel: (zoneLabel: string) => string
}): TimezoneOption[] {
  const { shopTimezone, currentTimezone, curatedLabel, storeTimeLabel } = params
  const labelOf = (zone: string) =>
    isCuratedTimezone(zone) ? curatedLabel(zone) : timezonePlaceName(zone)

  const options: TimezoneOption[] = CURATED_TIMEZONES.filter(
    (zone) => zone !== shopTimezone
  ).map((zone) => ({ value: zone, label: labelOf(zone) }))
  if (shopTimezone) {
    options.unshift({
      value: shopTimezone,
      label: storeTimeLabel(labelOf(shopTimezone)),
    })
  }
  if (
    currentTimezone &&
    !options.some((option) => option.value === currentTimezone)
  ) {
    options.push({ value: currentTimezone, label: labelOf(currentTimezone) })
  }
  return options
}
