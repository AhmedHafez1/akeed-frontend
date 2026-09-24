import type { useTranslations } from 'next-intl'
import { quietTimeParts } from '@/features/settings/domain/quietHours'

type Translator = ReturnType<typeof useTranslations>

/** "6 hours" / "15 minutes" from the `settings.embedded.timing` translator. */
export function formatDuration(t: Translator, minutes: number): string {
  return minutes > 0 && minutes % 60 === 0
    ? t('hours', { count: minutes / 60 })
    : t('minutes', { count: minutes })
}

/** "9:00 PM" / "9:00 مساءً" from an `HH:mm` value. */
export function formatQuietTime(t: Translator, value: string): string {
  const { hour12, minute, period } = quietTimeParts(value)
  return t('timeValue', { time: `${hour12}:${minute}`, period: t(period) })
}

/** A readable place name for an IANA zone outside the curated list. */
export function timezonePlaceName(zone: string): string {
  return (zone.split('/').pop() ?? zone).replaceAll('_', ' ')
}
