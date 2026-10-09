import { describe, expect, it } from 'vitest'
import type { OnboardingTestAttempt } from '@/features/onboarding/domain/onboarding.types'
import { buildTestTimeline, type TestTimelineLabels } from './onboardingTest'

const labels: TestTimelineLabels = {
  sending: 'sending',
  sent: 'sent',
  awaitingDelivery: 'awaiting',
  delivered: 'delivered',
  tapConfirm: 'tap confirm',
  confirmed: 'confirmed',
  canceled: 'canceled',
  autoDetect: 'detect',
}

function attempt(
  overrides: Partial<OnboardingTestAttempt>
): OnboardingTestAttempt {
  return {
    verificationId: 'v-1',
    status: 'sent',
    sentAt: '2026-10-09T07:06:00.000Z',
    deliveredAt: null,
    readAt: null,
    confirmedAt: null,
    canceledAt: null,
    ...overrides,
  }
}

const formatTime = (iso: string) => iso.slice(11, 16)

describe('buildTestTimeline', () => {
  it('waits on the reply once the message has arrived', () => {
    const rows = buildTestTimeline(
      attempt({ status: 'delivered', deliveredAt: '2026-10-09T07:06:05.000Z' }),
      labels,
      formatTime
    )

    expect(rows.map((row) => row.state)).toEqual([
      'done',
      'done',
      'current',
      'upcoming',
    ])
    expect(rows[2].label).toBe('tap confirm')
  })

  it('completes every cue on Confirm', () => {
    const rows = buildTestTimeline(
      attempt({ status: 'confirmed', confirmedAt: '2026-10-09T07:07:00.000Z' }),
      labels,
      formatTime
    )

    expect(rows.every((row) => row.state === 'done')).toBe(true)
    expect(rows[2]).toMatchObject({ label: 'confirmed', timeLabel: '07:07' })
  })

  it('completes every cue on Cancel, with the time of the cancel', () => {
    const rows = buildTestTimeline(
      attempt({ status: 'canceled', canceledAt: '2026-10-09T07:08:00.000Z' }),
      labels,
      formatTime
    )

    expect(rows.every((row) => row.state === 'done')).toBe(true)
    expect(rows[2]).toMatchObject({ label: 'canceled', timeLabel: '07:08' })
    expect(rows[2].note).toBeUndefined()
  })
})
