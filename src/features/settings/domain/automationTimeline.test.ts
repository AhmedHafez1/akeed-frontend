import { describe, expect, it } from 'vitest'
import {
  buildAutomationTimeline,
  type TimelineInput,
} from './automationTimeline'

const base: TimelineInput = {
  isAutoVerifyEnabled: true,
  sendDelayMinutes: 0,
  followUpEnabled: true,
  followUpDelayMinutes: 360,
  escalationEnabled: true,
  escalationGapMinutes: 720,
  quietHoursEnabled: true,
  quietHoursStart: '21:00',
  quietHoursEnd: '09:00',
}

describe('buildAutomationTimeline', () => {
  it('builds the four steps in order with their delays', () => {
    const timeline = buildAutomationTimeline(base)

    expect(timeline.steps.map((step) => step.id)).toEqual([
      'newOrder',
      'confirmation',
      'reminder',
      'needsAction',
    ])
    expect(timeline.steps[1].delay).toEqual({ kind: 'immediate' })
    expect(timeline.steps[2].delay).toEqual({
      kind: 'after',
      minutes: 360,
      relativeTo: 'firstMessage',
    })
    expect(timeline.steps[3].delay).toEqual({
      kind: 'after',
      minutes: 720,
      relativeTo: 'reminder',
    })
    expect(timeline.quietHours).toEqual({ start: '21:00', end: '09:00' })
  })

  it('shows a delayed first send', () => {
    const timeline = buildAutomationTimeline({ ...base, sendDelayMinutes: 15 })
    expect(timeline.steps[1].delay).toEqual({
      kind: 'after',
      minutes: 15,
      relativeTo: 'order',
    })
  })

  it('counts the alert from the first message when the reminder is off', () => {
    const timeline = buildAutomationTimeline({
      ...base,
      followUpEnabled: false,
    })
    expect(timeline.steps[2].isOn).toBe(false)
    expect(timeline.steps[3]).toMatchObject({
      isOn: true,
      delay: { relativeTo: 'firstMessage' },
    })
  })

  it('marks a disabled alert as off', () => {
    expect(
      buildAutomationTimeline({ ...base, escalationEnabled: false }).steps[3]
        .isOn
    ).toBe(false)
  })

  it('turns every message step off when auto-confirmation is off', () => {
    const timeline = buildAutomationTimeline({
      ...base,
      isAutoVerifyEnabled: false,
    })
    expect(timeline.steps.map((step) => step.isOn)).toEqual([
      true,
      false,
      false,
      false,
    ])
    expect(timeline.quietHours).toBeNull()
  })

  it('omits the quiet-hours line when quiet hours are off', () => {
    expect(
      buildAutomationTimeline({ ...base, quietHoursEnabled: false }).quietHours
    ).toBeNull()
  })

  it('treats an invalid custom delay as immediate', () => {
    expect(
      buildAutomationTimeline({ ...base, sendDelayMinutes: null }).steps[1]
        .delay
    ).toEqual({ kind: 'immediate' })
  })
})
