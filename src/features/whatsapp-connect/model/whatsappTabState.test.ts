import { describe, expect, it } from 'vitest'
import {
  availabilityFixture,
  connectionFixture,
  templateFixture,
} from '../testing/whatsappFixtures'
import {
  senderReason,
  templateMessage,
  templateStatus,
  whatsappTabView,
  type ConnectionView,
} from './whatsappTabState'

function connected(
  ...args: Parameters<typeof whatsappTabView>
): ConnectionView {
  const view = whatsappTabView(...args)
  if (view.kind !== 'connection') throw new Error(`Expected a connection`)
  return view
}

describe('whatsappTabView without a connection', () => {
  it('hides everything while connecting is unavailable', () => {
    expect(
      whatsappTabView(availabilityFixture({ available: false }), null)
    ).toEqual({ kind: 'hidden' })
    expect(whatsappTabView(undefined, null)).toEqual({ kind: 'hidden' })
  })

  it.each([
    [true, true],
    [false, false],
  ])('offers connecting, to the owner only (owner %s)', (owner, canConnect) => {
    expect(
      whatsappTabView(availabilityFixture({ canConnect: owner }), null)
    ).toEqual({ kind: 'unconnected', canConnect })
  })
})

describe('whatsappTabView readiness', () => {
  it('is ready when every template would use the number', () => {
    const view = connected(availabilityFixture(), connectionFixture())
    expect(view.readiness).toBe('ready')
    expect(view.badge).toBe('connected')
    expect(view.readyCount).toBe(3)
    expect(view.banners).toEqual([])
  })

  it('varies by template and language, with the review banner', () => {
    const view = connected(
      availabilityFixture(),
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
    expect(view.readiness).toBe('templatesVary')
    expect(view.templates.map((row) => [row.language, row.sender])).toEqual([
      ['ar', 'yourNumber'],
      ['en', 'akeed'],
    ])
    expect(view.templates[1]).toMatchObject({
      status: 'pending',
      reason: 'templatePending',
    })
    expect(view.banners.map((banner) => banner.key)).toEqual([
      'templatesInReview',
    ])
  })

  it('never calls a degraded number ready, even with approved templates and an earlier own send', () => {
    const view = connected(
      availabilityFixture({
        alerts: [
          {
            kind: 'payment',
            reason: 'payment',
            severity: 'critical',
            action: 'whatsapp_manager',
            templates: [],
          },
        ],
        lastAccepted: {
          confirmation: {
            kind: 'merchant_own',
            reason: 'own_number',
            acceptedAt: '2026-11-04T08:00:00.000Z',
            deliveryStatus: 'read',
          },
          reminder: null,
        },
      }),
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
      })
    )
    expect(view.readiness).toBe('degradedPayment')
    expect(view.readyCount).toBe(0)
    expect(view.templates[0]).toMatchObject({
      status: 'approved',
      sender: 'akeed',
      reason: 'degraded',
    })
    expect(view.lastConfirmation?.kind).toBe('merchant_own')
    expect(view.banners).toEqual([
      expect.objectContaining({
        key: 'payment.payment',
        tone: 'critical',
        resumes: true,
      }),
    ])
  })

  it('reports sending switched off without a recovery claim', () => {
    const view = connected(
      availabilityFixture({
        sendingEnabled: false,
        alerts: [
          {
            kind: 'payment',
            reason: 'payment',
            severity: 'critical',
            action: 'whatsapp_manager',
            templates: [],
          },
        ],
      }),
      connectionFixture({
        health: {
          stateReason: null,
          qualityRating: null,
          degradedClass: 'payment',
          lastCheckedAt: null,
        },
      })
    )
    expect(view.readiness).toBe('sendingOff')
    expect(view.banners[0].key).toBe('sendingOff')
    expect(view.banners.every((banner) => !banner.resumes)).toBe(true)
    expect(view.banners.map((banner) => banner.key)).not.toContain(
      'templatesInReview'
    )
  })

  it('is preparing until setup finishes', () => {
    const view = connected(
      availabilityFixture(),
      connectionFixture({ state: 'verifying' })
    )
    expect(view.readiness).toBe('preparing')
    expect(view.badge).toBe('preparing')
  })
})

describe('whatsappTabView actions', () => {
  it('lets only the owner disconnect, and owners and admins change thank-yous', () => {
    const viewer = connected(
      availabilityFixture({
        canConnect: false,
        permissions: { canDisconnect: false, canUpdateThankYou: false },
      }),
      connectionFixture()
    )
    expect(viewer.canDisconnect).toBe(false)
    expect(viewer.thankYou.canUpdate).toBe(false)
    const admin = connected(
      availabilityFixture({
        canConnect: false,
        permissions: { canDisconnect: false, canUpdateThankYou: true },
      }),
      connectionFixture()
    )
    expect(admin.canDisconnect).toBe(false)
    expect(admin.thankYou.canUpdate).toBe(true)
  })

  it('offers reconnecting only once disconnected and connect is on', () => {
    const disconnected = connectionFixture({ state: 'disconnected' })
    const view = connected(availabilityFixture(), disconnected)
    expect(view).toMatchObject({
      readiness: 'disconnected',
      badge: 'disconnected',
      canDisconnect: false,
      canReconnect: true,
      reconnectNeedsDisconnect: false,
    })
    expect(
      connected(availabilityFixture({ available: false }), disconnected)
        .canReconnect
    ).toBe(false)
  })

  it('asks to disconnect before reconnecting an offboarded number', () => {
    const view = connected(
      availabilityFixture(),
      connectionFixture({ state: 'offboarded' })
    )
    expect(view).toMatchObject({
      readiness: 'offboarded',
      canDisconnect: true,
      canReconnect: false,
      reconnectNeedsDisconnect: true,
    })
  })

  it('keeps managing an existing connection while connecting is off', () => {
    const view = whatsappTabView(
      availabilityFixture({ available: false, canConnect: false }),
      connectionFixture()
    )
    expect(view.kind).toBe('connection')
  })

  it('keeps the confirmation and the reminder apart', () => {
    const reminder = {
      kind: 'akeed_system' as const,
      reason: 'template_pending',
      acceptedAt: '2026-11-04T09:00:00.000Z',
      deliveryStatus: 'delivered' as const,
    }
    const view = connected(
      availabilityFixture({
        lastAcceptedSend: reminder,
        lastAccepted: { confirmation: null, reminder },
      }),
      connectionFixture()
    )
    expect(view.lastConfirmation).toBeNull()
    expect(view.lastReminder).toEqual(reminder)
  })
})

describe('template helpers', () => {
  it.each([
    ['cod_confirm.ar.standard', 'confirmation'],
    ['cod_confirmation_ar', 'confirmation'],
    ['cod_reminder.fr.friendly', 'reminder'],
    ['ack_confirmed.en.standard', 'thankYouConfirmed'],
    ['ack_canceled.en.standard', 'thankYouCanceled'],
    ['something_else', 'other'],
  ])('names %s as %s', (key, message) => {
    expect(templateMessage(key)).toBe(message)
  })

  it.each([
    ['approved', 'utility', 'approved'],
    ['approved', 'marketing', 'recategorized'],
    ['pending', null, 'pending'],
    ['in_review', null, 'pending'],
    ['rejected', null, 'rejected'],
    ['paused', null, 'paused'],
    ['disabled', null, 'paused'],
    ['missing', null, 'missing'],
  ])('maps %s/%s to %s', (status, category, expected) => {
    expect(templateStatus(status, category)).toBe(expected)
  })

  it.each([
    ['own_number', null],
    ['degraded:payment', 'degraded'],
    ['template_recategorized', 'templateRecategorized'],
    ['feature_off', 'featureOff'],
    ['unheard_of', 'other'],
  ])('reads the sender reason %s', (reason, expected) => {
    expect(senderReason(reason)).toBe(expected)
  })
})
