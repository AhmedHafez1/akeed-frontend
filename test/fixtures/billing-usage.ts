import type { CreditUsage } from '@/features/billing/domain/creditUsage'
export function usageFixture(): CreditUsage {
  return {
    asOf: '2026-11-04T12:00:00Z',
    timeZone: 'UTC',
    monthStart: '2026-11-01',
    usedThisMonth: 3,
    bySender: { akeed: 2, ownNumber: 1 },
    daily: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 9, 22 + i)).toISOString().slice(0, 10),
      credits: i === 13 ? 3 : 0,
      akeedCredits: i === 13 ? 2 : 0,
      ownNumberCredits: i === 13 ? 1 : 0,
    })),
  }
}
