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
    /** The organization has a real (non-test) order. Absent on older APIs. */
    hasRealOrders?: boolean
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

export type StandaloneFirstRunStatus = 'loading' | 'first-run' | 'active'

/**
 * The standalone dashboard is in first run until the organization has a real
 * order. Only an explicit `false` counts: an API that does not report it yet
 * leaves the merchant on the full dashboard rather than stuck in first run.
 */
export function resolveStandaloneFirstRun(
  state: DashboardActivationState | undefined
): StandaloneFirstRunStatus {
  if (!state) return 'loading'
  return state.activation?.hasRealOrders === false ? 'first-run' : 'active'
}

/** The merchant skipped the onboarding test and has not tried it since. */
export function shouldShowSkippedTestReminder(
  activation: DashboardActivationState['activation']
): boolean {
  return !!activation?.testSkippedAt && !activation.testConfirmedAt
}
