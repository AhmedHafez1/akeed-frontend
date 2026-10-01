import { describe, expect, it } from 'vitest'
import type { DashboardOverview } from '../model/dashboard.model'
import { manualConfirmationsAfterSend } from './overviewMetrics'

function overview(manuallyConfirmed?: number) {
  return {
    funnel: { manually_confirmed: manuallyConfirmed },
  } as unknown as Pick<DashboardOverview, 'funnel'>
}

describe('manualConfirmationsAfterSend', () => {
  it('reads the backend manual confirmation count', () => {
    expect(manualConfirmationsAfterSend(overview(8))).toBe(8)
    expect(manualConfirmationsAfterSend(overview(0))).toBe(0)
  })

  it('is zero when the payload lacks the field or it is negative', () => {
    expect(manualConfirmationsAfterSend(overview())).toBe(0)
    expect(manualConfirmationsAfterSend(overview(-2))).toBe(0)
  })
})
