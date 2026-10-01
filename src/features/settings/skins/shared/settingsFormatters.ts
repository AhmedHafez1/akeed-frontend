import type { useTranslations } from 'next-intl'
import type { TimelineStep } from '@/features/settings/domain/automationTimeline'
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

/**
 * When a timeline step happens: "Immediately", "After 2 hours", "6 hours
 * later", or "Off". Null for the first step, which has no wait before it.
 */
export function formatStepDelay(
  t: Translator,
  step: TimelineStep
): string | null {
  if (!step.isOn) return t('stepOff')
  switch (step.delay.kind) {
    case 'none':
      return null
    case 'immediate':
      return t('delayImmediate')
    case 'after': {
      const duration = formatDuration(t, step.delay.minutes)
      return step.delay.relativeTo === 'reminder'
        ? t('delayAfterMore', { duration })
        : t('delayAfter', { duration })
    }
  }
}
