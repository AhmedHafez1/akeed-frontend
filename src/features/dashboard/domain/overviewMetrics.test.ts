import { describe, expect, it } from 'vitest'
import type { DashboardOverview } from '../model/dashboard.model'
import { manualConfirmationsAfterSend } from './overviewMetrics'

function overview(rateConfirmed: number, flowConfirmed: number) {
  return {
    kpis: { confirmation_rate: { confirmed: rateConfirmed } },
    funnel: { confirmed: flowConfirmed },
  } as unknown as Pick<DashboardOverview, 'kpis' | 'funnel'>
}

describe('manualConfirmationsAfterSend', () => {
  it('is the gap between confirmed-after-send and customer replies', () => {
    expect(manualConfirmationsAfterSend(overview(17, 15))).toBe(2)
    expect(manualConfirmationsAfterSend(overview(15, 15))).toBe(0)
  })

  it('never goes negative', () => {
    expect(manualConfirmationsAfterSend(overview(3, 5))).toBe(0)
  })
})
