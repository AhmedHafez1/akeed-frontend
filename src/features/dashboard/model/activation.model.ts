/** The slice of `/api/onboarding/state` the first-run dashboard reads. */
export interface DashboardActivationState {
  isAutoVerifyEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  billingPlanId: string | null
  activation?: {
    setupCompletedAt: string | null
    testSentAt: string | null
    testConfirmedAt: string | null
    testSkippedAt: string | null
    firstRealConfirmedAt: string | null
    isLive: boolean
    needsPlan: boolean
  }
  usage?: { used: number; limit: number; remaining: number } | null
}

export type ChecklistItemId = 'setup' | 'test' | 'firstOrder'

export interface ChecklistItem {
  id: ChecklistItemId
  isDone: boolean
}

/**
 * The three activation milestones. The last one is not a task: it completes
 * by itself when the first real COD order is confirmed.
 */
export function buildActivationChecklist(
  activation: DashboardActivationState['activation']
): ChecklistItem[] {
  return [
    { id: 'setup', isDone: !!activation?.setupCompletedAt },
    { id: 'test', isDone: !!activation?.testConfirmedAt },
    { id: 'firstOrder', isDone: !!activation?.firstRealConfirmedAt },
  ]
}

/**
 * The first-run panel belongs to installs that went through setup, and stays
 * until their first real order is confirmed. Stores installed before setup
 * existed never finish it, so they never see it.
 */
export function shouldShowActivation(
  state: DashboardActivationState | undefined
): boolean {
  return (
    !!state?.activation?.setupCompletedAt &&
    !state.activation.firstRealConfirmedAt
  )
}

/** Free messages are only shown while the store is on the Starter plan. */
export function resolveFreeMessagesLeft(
  state: DashboardActivationState | undefined
): number | null {
  if (state?.billingPlanId !== 'starter' || !state.usage) return null
  return state.usage.remaining
}
