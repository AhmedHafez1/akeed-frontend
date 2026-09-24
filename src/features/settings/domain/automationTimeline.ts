/**
 * The "what happens with each COD order" timeline, derived from the Timing
 * form values (saved or not). Pure so the card re-renders on every edit and
 * the ordering rules are unit-tested.
 */

export type TimelineStepId =
  | 'newOrder'
  | 'confirmation'
  | 'reminder'
  | 'needsAction'

export type TimelineDelay =
  | { kind: 'none' }
  | { kind: 'immediate' }
  /** Minutes after the previous step that is on. */
  | {
      kind: 'after'
      minutes: number
      relativeTo: 'order' | 'firstMessage' | 'reminder'
    }

export interface TimelineStep {
  id: TimelineStepId
  isOn: boolean
  delay: TimelineDelay
}

export interface AutomationTimeline {
  steps: TimelineStep[]
  quietHours: { start: string; end: string } | null
}

export interface TimelineInput {
  isAutoVerifyEnabled: boolean
  /** Null while the custom field holds an invalid value. */
  sendDelayMinutes: number | null
  followUpEnabled: boolean
  followUpDelayMinutes: number
  escalationEnabled: boolean
  /** The gap the tab shows: after the reminder, or after the first message. */
  escalationGapMinutes: number
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export function buildAutomationTimeline(
  input: TimelineInput
): AutomationTimeline {
  const sending = input.isAutoVerifyEnabled
  const sendDelay = input.sendDelayMinutes ?? 0
  const reminderOn = sending && input.followUpEnabled
  const needsActionOn = sending && input.escalationEnabled

  return {
    steps: [
      { id: 'newOrder', isOn: true, delay: { kind: 'none' } },
      {
        id: 'confirmation',
        isOn: sending,
        delay:
          sendDelay > 0
            ? { kind: 'after', minutes: sendDelay, relativeTo: 'order' }
            : { kind: 'immediate' },
      },
      {
        id: 'reminder',
        isOn: reminderOn,
        delay: {
          kind: 'after',
          minutes: input.followUpDelayMinutes,
          relativeTo: 'firstMessage',
        },
      },
      {
        id: 'needsAction',
        isOn: needsActionOn,
        delay: {
          kind: 'after',
          minutes: input.escalationGapMinutes,
          relativeTo: input.followUpEnabled ? 'reminder' : 'firstMessage',
        },
      },
    ],
    quietHours:
      sending && input.quietHoursEnabled
        ? { start: input.quietHoursStart, end: input.quietHoursEnd }
        : null,
  }
}
