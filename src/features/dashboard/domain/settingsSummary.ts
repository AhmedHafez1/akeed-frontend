/**
 * The follow-up delay as the dashboard says it: whole hours when it divides
 * evenly ("تذكير بعد 6 ساعات"), minutes otherwise.
 */
export function describeDelay(minutes: number): {
  unit: 'hours' | 'minutes'
  value: number
} {
  const safe = Math.max(Math.round(minutes), 0)
  return safe >= 60 && safe % 60 === 0
    ? { unit: 'hours', value: safe / 60 }
    : { unit: 'minutes', value: safe }
}

/**
 * One end of the quiet window, `21:00` → `9م` / `9 PM`.
 *
 * Minutes are kept only when they are not zero. Returns null for anything that
 * is not an `HH:mm` value, so a half-configured window reads as off.
 */
export function formatQuietHour(value: string | null, locale: string) {
  const match = value ? /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value) : null
  if (!match) return null
  const date = new Date(
    Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2]))
  )
  const formatted = new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
    hour: 'numeric',
    ...(match[2] === '00' ? {} : { minute: '2-digit' }),
    timeZone: 'UTC',
  }).format(date)
  return locale === 'ar' ? formatted.replace(/\s+/g, '') : formatted
}

/** `9م–9ص`, or null when either end is missing. */
export function formatQuietWindow(
  start: string | null,
  end: string | null,
  locale: string
) {
  const from = formatQuietHour(start, locale)
  const to = formatQuietHour(end, locale)
  return from && to ? `${from}–${to}` : null
}
