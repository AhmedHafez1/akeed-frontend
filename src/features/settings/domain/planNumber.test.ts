import { describe, expect, it } from 'vitest'
import {
  availabilityFixture,
  connectionFixture,
  templateFixture,
} from '@/features/whatsapp-connect/testing/whatsappFixtures'
import { resolvePlanNumber } from './planNumber'

function state(
  overrides: Partial<Parameters<typeof resolvePlanNumber>[0]> = {}
) {
  return resolvePlanNumber({
    availability: availabilityFixture(),
    connection: connectionFixture(),
    isLoading: false,
    isError: false,
    ...overrides,
  })
}

describe('Plan number state', () => {
  it('distinguishes offered from connected', () => {
    expect(state({ connection: null })).toMatchObject({
      status: 'unconnected',
      visible: true,
      connected: false,
    })
    expect(state()).toMatchObject({ status: 'ready', connected: true })
  })
  it.each(['connecting', 'verifying', 'disconnected', 'offboarded'] as const)(
    'hides current own-number usage while %s',
    (connectionState) => {
      expect(
        state({ connection: connectionFixture({ state: connectionState }) })
      ).toMatchObject({
        connected: false,
        status: ['connecting', 'verifying'].includes(connectionState)
          ? 'preparing'
          : 'disconnected',
      })
    }
  )
  it('keeps an active degraded number visible without treating it as ready', () => {
    expect(
      state({
        connection: connectionFixture({
          health: {
            stateReason: null,
            qualityRating: null,
            degradedClass: 'payment',
            lastCheckedAt: null,
          },
        }),
      })
    ).toMatchObject({ status: 'attention', connected: true })
  })
  it('does not promise sending when own-number sending is disabled', () => {
    expect(
      state({ availability: availabilityFixture({ sendingEnabled: false }) })
        .status
    ).toBe('attention')
  })
  it('does not offer a new connection when connecting is unavailable', () => {
    expect(
      state({
        availability: availabilityFixture({
          available: false,
          canConnect: true,
        }),
      }).canConnect
    ).toBe(false)
  })
  it('distinguishes partial template coverage from full unavailability', () => {
    expect(
      state({
        connection: connectionFixture({
          templateDetails: [
            templateFixture('a', 'en'),
            templateFixture('b', 'ar', {
              readiness: { kind: 'akeed_system', reason: 'template_pending' },
            }),
          ],
        }),
      }).status
    ).toBe('partial')
    expect(
      state({ connection: connectionFixture({ templateDetails: [] }) }).status
    ).toBe('attention')
  })
  it.each([{ isLoading: true }, { isError: true }])(
    'keeps unknown status from promoting connection',
    (override) => {
      expect(state(override)).toMatchObject({
        status: 'unknown',
        canConnect: false,
      })
    }
  )
})
