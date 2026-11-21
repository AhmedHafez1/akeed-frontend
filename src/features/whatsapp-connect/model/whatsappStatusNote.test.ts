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

function noteOf(
  connection: WhatsappConnectionStatus | null,
  availability: WhatsappSenderAvailability = availabilityFixture()
) {
  const view = whatsappTabView(availability, connection)
  if (view.kind === 'hidden') throw new Error('Expected a visible tab')
  return view.note
}

type Template = WhatsappConnectionStatus['templateDetails'][number]
const own = (key: string, language: string): Template =>
  templateFixture(key, language)
/** Meta has not answered yet; the sender would be Akeed's. */
const pending = (key: string, language: string, reason = 'not_ready') =>
  templateFixture(key, language, {
    status: 'pending',
    readiness: { kind: 'akeed_system', reason },
  })
const rejected = (
  key: string,
  language: string,
  reason = 'template_rejected'
) =>
  templateFixture(key, language, {
    status: 'rejected',
    readiness: { kind: 'akeed_system', reason },
  })
const approvedUntilReady = (key: string, language: string) =>
  templateFixture(key, language, {
    readiness: { kind: 'akeed_system', reason: 'not_ready' },
  })
const degradedRow = (key: string, language: string, klass: string) =>
  templateFixture(key, language, {
    readiness: { kind: 'akeed_system', reason: 'degraded:' + klass },
  })

function health(
  degradedClass: string | null,
  qualityRating: string | null = 'GREEN'
): WhatsappConnectionStatus['health'] {
  return {
    stateReason: null,
    qualityRating,
    degradedClass,
    lastCheckedAt: '2026-11-21T10:00:00.000Z',
  }
}

/** 45 templates in review, like a merchant that has just connected. */
const inReview = Array.from({ length: 45 }, (_, i) =>
  pending(`cod_confirm.t${i}.standard`, 'ar')
)

describe('WhatsApp status note', () => {
  describe('not connected and disconnected', () => {
    it('says Akeed sends when there is no connection', () => {
      expect(noteOf(null)).toMatchObject({
        status: 'not_connected',
        key: 'notConnected',
      })
    })
    it.each(['disconnected', 'offboarded'] as const)(
      'says Akeed sends after %s',
      (state) => {
        expect(noteOf(connectionFixture({ state }))).toMatchObject({
          status: 'disconnected',
          key: 'disconnected',
        })
      }
    )
  })

  describe('setting up', () => {
    it('covers a connection whose setup is still running', () => {
      expect(
        noteOf(
          connectionFixture({
            state: 'connecting',
            templateDetails: [],
            setup: { ...connectionFixture().setup, status: 'running' },
          })
        )
      ).toMatchObject({ status: 'setting_up', key: 'settingUp' })
    })
    it('keeps a failed setup that will retry in the setting-up state', () => {
      expect(
        noteOf(
          connectionFixture({
            state: 'connecting',
            templateDetails: [],
            setup: {
              ...connectionFixture().setup,
              status: 'failed',
              retryAt: '2026-11-21T12:00:00.000Z',
            },
          })
        )
      ).toMatchObject({ status: 'setting_up' })
    })
    it('reports setup that cannot finish as a sending issue, not as waiting', () => {
      for (const setup of [
        { status: 'exhausted', retryAt: null },
        { status: 'failed', retryAt: null },
      ])
        expect(
          noteOf(
            connectionFixture({
              state: 'connecting',
              templateDetails: [],
              setup: { ...connectionFixture().setup, ...setup },
            })
          )
        ).toMatchObject({
          status: 'sending_issue',
          key: 'sendingIssue.setup',
        })
    })
    it('treats a verified number with every template approved as still finishing', () => {
      expect(
        noteOf(
          connectionFixture({
            state: 'verifying',
            templateDetails: [
              approvedUntilReady('cod_confirm.ar.standard', 'ar'),
              approvedUntilReady('cod_confirm.en.standard', 'en'),
            ],
          })
        )
      ).toMatchObject({ status: 'setting_up', key: 'settingUp' })
    })
    it('treats a verifying number whose templates are not created yet as setting up', () => {
      expect(
        noteOf(connectionFixture({ state: 'verifying', templateDetails: [] }))
      ).toMatchObject({ status: 'setting_up' })
    })
  })

  describe('waiting for Meta to review templates', () => {
    it('is not a sending issue for a restricted number whose templates are in review', () => {
      const note = noteOf(
        connectionFixture({
          state: 'verifying',
          health: health('restricted', null),
          templateDetails: inReview,
        })
      )
      expect(note).toMatchObject({
        status: 'awaiting_templates',
        key: 'awaitingTemplates',
      })
    })
    it('stays awaiting while only some templates are approved on a verifying number', () => {
      expect(
        noteOf(
          connectionFixture({
            state: 'verifying',
            health: health('restricted', null),
            templateDetails: [
              approvedUntilReady('cod_confirm.ar.standard', 'ar'),
              pending('cod_confirm.en.standard', 'en'),
            ],
          })
        )
      ).toMatchObject({ status: 'awaiting_templates' })
    })
    it('counts approvals only for the active number that already sends some of them', () => {
      expect(
        noteOf(
          connectionFixture({
            templateDetails: [
              own('cod_confirm.ar.standard', 'ar'),
              own('cod_confirm.fr.standard', 'fr'),
              pending('cod_confirm.en.standard', 'en', 'template_pending'),
            ],
          })
        )
      ).toMatchObject({
        status: 'awaiting_templates',
        key: 'awaitingTemplatesPartial',
        approved: 2,
        total: 3,
      })
    })
    it('waits for an active number with nothing approved and no templates yet', () => {
      expect(noteOf(connectionFixture({ templateDetails: [] }))).toMatchObject({
        status: 'awaiting_templates',
        key: 'awaitingTemplates',
      })
      expect(
        noteOf(
          connectionFixture({
            templateDetails: [
              pending('cod_confirm.ar.standard', 'ar', 'template_pending'),
            ],
          })
        )
      ).toMatchObject({ key: 'awaitingTemplates' })
    })
  })

  describe('active', () => {
    it('says the number sends only when every template resolves to it', () => {
      expect(noteOf(connectionFixture())).toMatchObject({
        status: 'active',
        key: 'active',
        number: '+20 100 555 0101',
      })
    })
    it('never says active while a template would still go from Akeed', () => {
      expect(
        noteOf(
          connectionFixture({
            templateDetails: [
              own('cod_confirm.ar.standard', 'ar'),
              pending('cod_confirm.en.standard', 'en', 'template_pending'),
            ],
          })
        ).status
      ).not.toBe('active')
    })
    it('keeps a red quality rating active, because dispatches still use the number', () => {
      expect(
        noteOf(connectionFixture({ health: health(null, 'RED') }))
      ).toMatchObject({ status: 'active' })
    })
    it('reports no number when none is known', () => {
      expect(
        noteOf(connectionFixture({ displayPhoneNumber: null }))
      ).toMatchObject({ status: 'active', number: null })
    })
  })

  describe('sending issue', () => {
    it.each([
      ['restricted', 'sendingIssue.restricted'],
      ['payment', 'sendingIssue.payment'],
    ] as const)(
      'explains a %s number that is active and has approved templates',
      (klass, key) => {
        const note = noteOf(
          connectionFixture({
            health: health(klass),
            templateDetails: [
              degradedRow('cod_confirm.ar.standard', 'ar', klass),
            ],
          })
        )
        expect(note).toMatchObject({ status: 'sending_issue', key })
        // The sending row already shows this action beside its button.
        expect(note.action).toBeNull()
      }
    )
    it('is a sending issue, not a wait, when restricted with every template approved', () => {
      const note = noteOf(
        connectionFixture({
          state: 'verifying',
          health: health('restricted', null),
          templateDetails: [
            approvedUntilReady('cod_confirm.ar.standard', 'ar'),
            approvedUntilReady('cod_confirm.en.standard', 'en'),
          ],
        })
      )
      expect(note).toMatchObject({
        status: 'sending_issue',
        key: 'sendingIssue.restricted',
        // No row shows it while the number is still being verified.
        action: 'restricted',
      })
    })
    it('treats a degraded number that has already been active as a real issue even with templates pending', () => {
      expect(
        noteOf(
          connectionFixture({
            health: health('restricted'),
            templateDetails: [
              pending('cod_confirm.ar.standard', 'ar', 'degraded:restricted'),
            ],
          })
        )
      ).toMatchObject({ status: 'sending_issue' })
    })
    it('asks to reconnect when access is no longer valid', () => {
      for (const state of ['active', 'verifying'] as const)
        expect(
          noteOf(
            connectionFixture({
              state,
              health: health('credentials', null),
              templateDetails: inReview,
            })
          )
        ).toMatchObject({
          status: 'sending_issue',
          key: 'sendingIssue.credentials',
        })
    })
    it('names an unknown degradation as temporarily unavailable without repeating it', () => {
      expect(
        noteOf(
          connectionFixture({
            health: health('something_new'),
            templateDetails: [
              degradedRow('cod_confirm.ar.standard', 'ar', 'something_new'),
            ],
          })
        )
      ).toMatchObject({
        status: 'sending_issue',
        key: 'sendingIssue.unavailable',
        action: null,
      })
    })
  })

  describe('templates rejected', () => {
    it('keeps sending from the number for the templates that are fine', () => {
      expect(
        noteOf(
          connectionFixture({
            templateDetails: [
              own('cod_confirm.ar.standard', 'ar'),
              rejected('cod_confirm.en.standard', 'en'),
            ],
          })
        )
      ).toMatchObject({
        status: 'templates_rejected',
        key: 'templatesRejected',
      })
    })
    it('says Akeed sends everything while nothing is approved yet', () => {
      for (const state of ['active', 'verifying'] as const)
        expect(
          noteOf(
            connectionFixture({
              state,
              templateDetails: [
                rejected('cod_confirm.ar.standard', 'ar'),
                pending('cod_confirm.en.standard', 'en'),
              ],
            })
          )
        ).toMatchObject({
          status: 'templates_rejected',
          key: 'templatesRejectedAkeed',
        })
    })
    it('treats a template recategorized away from utility as unavailable', () => {
      expect(
        noteOf(
          connectionFixture({
            templateDetails: [
              templateFixture('cod_confirm.ar.standard', 'ar', {
                category: 'marketing',
                readiness: {
                  kind: 'akeed_system',
                  reason: 'template_recategorized',
                },
              }),
            ],
          })
        )
      ).toMatchObject({ status: 'templates_rejected' })
    })
  })

  describe('paused', () => {
    it('adds no caption while sending from merchant numbers is switched off, because the sending row says it', () => {
      expect(
        noteOf(
          connectionFixture(),
          availabilityFixture({ sendingEnabled: false })
        )
      ).toMatchObject({ status: 'paused', key: null })
    })
    it('lets a disconnected number say so even when sending is off', () => {
      expect(
        noteOf(
          connectionFixture({ state: 'disconnected' }),
          availabilityFixture({ sendingEnabled: false })
        ).status
      ).toBe('disconnected')
    })
  })

  describe('unconnected tab', () => {
    it('carries the not-connected note', () => {
      const view = whatsappTabView(availabilityFixture(), null)
      expect(view).toMatchObject({
        kind: 'unconnected',
        note: { status: 'not_connected' },
      })
    })
  })
})
