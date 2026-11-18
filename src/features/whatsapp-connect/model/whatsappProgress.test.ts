import { describe, expect, it } from 'vitest'
import {
  availabilityFixture,
  connectionFixture,
  templateFixture,
} from '../testing/whatsappFixtures'
import type {
  WhatsappConnectionStatus,
  WhatsappSenderAvailability,
} from '../api/whatsappConnectApi'
import { whatsappTabView } from './whatsappTabState'
import { hasPendingWhatsappSetup } from './whatsappProgress'

function progress(
  connection: WhatsappConnectionStatus,
  sender: WhatsappSenderAvailability = availabilityFixture()
) {
  const view = whatsappTabView(sender, connection)
  if (view.kind !== 'connection') throw new Error('Expected connection')
  return view.progress
}

describe('current WhatsApp progress', () => {
  it('never treats zero templates as approved', () => {
    const result = progress(connectionFixture({ templateDetails: [] }))
    expect(result.rows.map((row) => row.status)).toEqual([
      'connected',
      'preparing',
      'waiting',
    ])
    expect(result.coverage).toBe('pending')
  })
  it('distinguishes partial approval and partial sending', () => {
    const result = progress(
      connectionFixture({
        templateDetails: [
          templateFixture('cod_confirm.ar.standard', 'ar'),
          templateFixture('cod_confirm.en.standard', 'en', {
            status: 'pending',
            readiness: { kind: 'akeed_system', reason: 'template_pending' },
          }),
        ],
      })
    )
    expect(result.rows.map((row) => row.status)).toEqual([
      'connected',
      'someApproved',
      'someMessages',
    ])
    expect(result.rows[1].tone).toBe('info')
    expect(result.coverage).toBe('partial')
  })
  it('shows approvals in green and readiness without requiring a historical send', () => {
    const result = progress(connectionFixture())
    expect(result.rows.map((row) => row.status)).toEqual([
      'connected',
      'approved',
      'ready',
    ])
    expect(result.rows.every((row) => row.tone === 'success')).toBe(true)
    expect(result.coverage).toBeNull()
  })
  it('keeps approval separate from current health and old successful sends', () => {
    const result = progress(
      connectionFixture({
        health: {
          stateReason: null,
          qualityRating: 'GREEN',
          degradedClass: 'payment',
          lastCheckedAt: null,
        },
        templateDetails: [
          templateFixture('cod_confirm.ar.standard', 'ar', {
            readiness: { kind: 'akeed_system', reason: 'degraded:payment' },
          }),
        ],
      }),
      availabilityFixture({
        lastAccepted: {
          confirmation: {
            kind: 'merchant_own',
            reason: 'own_number',
            acceptedAt: '2026-11-01T00:00:00Z',
            deliveryStatus: 'delivered',
          },
          reminder: null,
        },
      })
    )
    expect(result.rows[1]).toMatchObject({
      status: 'approved',
      tone: 'success',
    })
    expect(result.rows[2]).toMatchObject({
      status: 'attention',
      issue: 'payment',
      action: 'whatsapp_manager',
      done: false,
    })
  })
  it('shows disabled sending without promising automatic recovery', () => {
    const result = progress(
      connectionFixture(),
      availabilityFixture({ sendingEnabled: false })
    )
    expect(result.rows[2]).toMatchObject({
      status: 'paused',
      issue: 'sendingOff',
      done: false,
    })
    expect(result.coverage).toBeNull()
  })
  it('does not count non-utility approval and exposes its recovery', () => {
    const result = progress(
      connectionFixture({
        templateDetails: [
          templateFixture('cod_confirm.en.standard', 'en', {
            category: 'marketing',
            readiness: {
              kind: 'akeed_system',
              reason: 'template_recategorized',
            },
          }),
        ],
      })
    )
    expect(result.rows[1]).toMatchObject({
      status: 'attention',
      issue: 'templates',
      action: 'support',
    })
  })
  it('places exhausted setup and an automatic retry by the template row', () => {
    const connection = connectionFixture({ templateDetails: [] })
    expect(
      progress({
        ...connection,
        setup: { ...connection.setup, status: 'exhausted' },
      }).rows[1]
    ).toMatchObject({ status: 'attention', issue: 'setup', action: 'support' })
    expect(
      progress({
        ...connection,
        setup: {
          ...connection.setup,
          status: 'failed',
          retryAt: '2026-11-18T20:00:00Z',
        },
      }).rows[1]
    ).toMatchObject({ issue: 'retry' })
    const complete = connectionFixture()
    expect(
      progress({
        ...complete,
        setup: { ...complete.setup, status: 'exhausted' },
      }).rows[2].status
    ).toBe('attention')
  })
  it.each(['disconnected', 'offboarded'] as const)(
    'hides progress after %s',
    (state) => {
      expect(progress(connectionFixture({ state })).rows).toEqual([])
    }
  )
  it('offers reconnect once, beside the number', () => {
    const connection = connectionFixture({
      health: {
        stateReason: null,
        qualityRating: 'GREEN',
        degradedClass: 'credentials',
        lastCheckedAt: null,
      },
    })
    const rows = progress(connection).rows
    expect(rows[0]).toMatchObject({ status: 'reconnect', action: 'reconnect' })
    expect(rows[2].status).toBe('attention')
    expect(rows[2].action).toBeUndefined()
  })
})

describe('pending status refresh eligibility', () => {
  it('polls setup, zero templates and pending approvals', () => {
    expect(
      hasPendingWhatsappSetup(connectionFixture({ state: 'connecting' }))
    ).toBe(true)
    expect(
      hasPendingWhatsappSetup(connectionFixture({ templateDetails: [] }))
    ).toBe(true)
    expect(
      hasPendingWhatsappSetup(
        connectionFixture({
          templateDetails: [templateFixture('x', 'en', { status: 'pending' })],
        })
      )
    ).toBe(true)
  })
  it('stops for complete, disconnected or exhausted setup', () => {
    expect(hasPendingWhatsappSetup(connectionFixture())).toBe(false)
    expect(
      hasPendingWhatsappSetup(connectionFixture({ state: 'disconnected' }))
    ).toBe(false)
    const connection = connectionFixture({ templateDetails: [] })
    expect(
      hasPendingWhatsappSetup({
        ...connection,
        setup: { ...connection.setup, status: 'exhausted' },
      })
    ).toBe(false)
    expect(hasPendingWhatsappSetup(null)).toBe(false)
  })
})
