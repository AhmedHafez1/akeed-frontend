import type { OnboardingTestAttempt } from '@/features/onboarding/domain/onboarding.types'

export type TimelineRowState = 'done' | 'current' | 'upcoming'

export interface TimelineRow {
  id: string
  label: string
  state: TimelineRowState
  /** Formatted time the row completed, shown at the end of the row. */
  timeLabel?: string
  /** The one action the merchant must take; drawn larger than the rest. */
  isAction?: boolean
  note?: string
}

export interface TestTimelineLabels {
  sending: string
  sent: string
  awaitingDelivery: string
  delivered: string
  tapConfirm: string
  confirmed: string
  canceled: string
  autoDetect: string
}

/**
 * Maps the latest test attempt onto the four cues of the test step:
 * sent, arrived on the phone, the merchant's reply (the one action), and
 * detection. Confirm and Cancel both complete it.
 */
export function buildTestTimeline(
  test: OnboardingTestAttempt | null,
  labels: TestTimelineLabels,
  formatTime: (iso: string) => string
): TimelineRow[] {
  const sentAt = test?.sentAt ?? null
  const arrivedAt = test?.deliveredAt ?? test?.readAt ?? null
  const isConfirmed = test?.status === 'confirmed'
  const isCanceled = test?.status === 'canceled'
  const isAnswered = isConfirmed || isCanceled
  const hasArrived = !!arrivedAt || isAnswered
  const answeredAt = isCanceled ? test?.canceledAt : test?.confirmedAt

  return [
    {
      id: 'sent',
      label: sentAt ? labels.sent : labels.sending,
      state: sentAt ? 'done' : 'current',
      timeLabel: sentAt ? formatTime(sentAt) : undefined,
    },
    {
      id: 'delivered',
      label: hasArrived ? labels.delivered : labels.awaitingDelivery,
      state: hasArrived ? 'done' : sentAt ? 'current' : 'upcoming',
      timeLabel: arrivedAt ? formatTime(arrivedAt) : undefined,
    },
    {
      id: 'tap',
      label: isCanceled
        ? labels.canceled
        : isConfirmed
          ? labels.confirmed
          : labels.tapConfirm,
      state: isAnswered ? 'done' : hasArrived ? 'current' : 'upcoming',
      timeLabel: answeredAt ? formatTime(answeredAt) : undefined,
      isAction: true,
    },
    {
      id: 'detect',
      label: labels.autoDetect,
      state: isAnswered ? 'done' : 'upcoming',
    },
  ]
}
