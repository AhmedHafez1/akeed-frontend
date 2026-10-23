import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import type { CapacitySummary } from '@/features/dashboard/model/dashboard.model'
import { renderStandalone } from '../shared/standaloneTestUtils'
import { renderEmbedded } from '../../../embedded/components/embeddedTestUtils'
import { BlockedOrdersBanner } from './BlockedOrdersBanner'
import { BlockedOrdersBanner as EmbeddedBlockedOrdersBanner } from '../../../embedded/components/overview/BlockedOrdersBanner'
import { resolveRowStatus } from '@/features/dashboard/domain/confirmationRowStatus'
import { resolveRowDescriptionKey } from '@/features/dashboard/domain/verificationRow'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

const credits: CapacitySummary = {
  blocked_count: 3,
  mode: 'credits',
  remaining: 0,
  action: 'recharge',
  reset_at: null,
}

const plan: CapacitySummary = {
  blocked_count: 12,
  mode: 'plan',
  remaining: 0,
  action: 'upgrade',
  reset_at: '2026-11-01T00:00:00.000Z',
}

describe('BlockedOrdersBanner (standalone)', () => {
  it('shows nothing while no order is blocked', () => {
    const { container } = renderStandalone(
      <BlockedOrdersBanner
        capacity={{ ...credits, blocked_count: 0 }}
        timeZone="UTC"
      />
    )
    expect(container.textContent).toBe('')
    renderStandalone(<BlockedOrdersBanner capacity={null} timeZone="UTC" />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('counts the waiting orders and links to buying credits', () => {
    renderStandalone(
      <BlockedOrdersBanner capacity={credits} timeZone="UTC" />,
      'en'
    )

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('Orders waiting to be sent: 3')
    expect(alert.textContent).toContain('Credits left: 0')
    expect(alert.textContent).toContain('Buy credits and Akeed sends them')
    expect(
      screen.getByRole('link', { name: 'Buy credits' }).getAttribute('href')
    ).toBe('/en/billing')
  })

  it('speaks Arabic by default', () => {
    renderStandalone(<BlockedOrdersBanner capacity={credits} timeZone="UTC" />)

    expect(screen.getByRole('alert').textContent).toContain(
      'طلبات بانتظار الإرسال: 3'
    )
    expect(
      screen.getByRole('link', { name: 'اشحن رصيدك' }).getAttribute('href')
    ).toBe('/ar/billing')
  })
})

describe('BlockedOrdersBanner (embedded)', () => {
  it('offers an upgrade with the reset date beside it', () => {
    const onChoosePlan = vi.fn()
    renderEmbedded(
      <EmbeddedBlockedOrdersBanner
        capacity={plan}
        timeZone="UTC"
        onChoosePlan={onChoosePlan}
      />,
      'en'
    )

    expect(screen.getByText('Orders waiting to be sent: 12')).toBeTruthy()
    expect(screen.getByText(/renews on Nov 1, 2026/)).toBeTruthy()
    expect(screen.getByText(/Confirmations left this period: 0/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade plan' }))
    expect(onChoosePlan).toHaveBeenCalledTimes(1)
  })

  it('has no button on the top plan, only the reset date', () => {
    renderEmbedded(
      <EmbeddedBlockedOrdersBanner
        capacity={{ ...plan, action: 'wait_reset' }}
        timeZone="UTC"
        onChoosePlan={vi.fn()}
      />,
      'en'
    )

    expect(
      screen.getByText(/go out automatically when your allowance renews on/)
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Upgrade plan' })).toBeNull()
  })
})

describe('blocked rows', () => {
  const row = {
    status: 'blocked',
    reason: 'INSUFFICIENT_CREDITS',
  } as VerificationItem

  it('read as waiting, not failed, and say they send themselves', () => {
    expect(resolveRowStatus(row)).toEqual({
      badge: 'blocked',
      tone: 'warning',
      kind: 'needsAction',
      sub: 'sub.waitingForCapacity',
    })
    expect(resolveRowDescriptionKey(row)).toBe('descriptions.blocked')
  })

  it('explain an order that waited too long', () => {
    expect(
      resolveRowDescriptionKey({
        status: 'failed',
        reason: 'capacity_block_stale',
      } as VerificationItem)
    ).toBe('reasons.capacity_block_stale')
  })
})
