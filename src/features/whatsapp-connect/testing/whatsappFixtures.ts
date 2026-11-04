import type {
  WhatsappConnectionStatus,
  WhatsappSenderAvailability,
} from '../api/whatsappConnectApi'

/** Synthetic answers only: no real number, account or merchant. */

export function availabilityFixture(
  overrides: Partial<WhatsappSenderAvailability> = {}
): WhatsappSenderAvailability {
  return {
    available: true,
    appId: '0000000000',
    configId: '1111111111',
    canConnect: true,
    sendingEnabled: true,
    permissions: { canDisconnect: true, canUpdateThankYou: true },
    lastAcceptedSend: null,
    lastAccepted: { confirmation: null, reminder: null },
    alerts: [],
    ...overrides,
  }
}

type TemplateDetail = WhatsappConnectionStatus['templateDetails'][number]

export function templateFixture(
  key: string,
  language: string,
  overrides: Partial<TemplateDetail> = {}
): TemplateDetail {
  return {
    key,
    language,
    languageCode: language,
    status: 'approved',
    category: 'utility',
    readiness: { kind: 'merchant_own', reason: 'own_number' },
    ...overrides,
  }
}

export function connectionFixture(
  overrides: Partial<WhatsappConnectionStatus> = {}
): WhatsappConnectionStatus {
  return {
    thankYouEnabled: true,
    state: 'active',
    signupPath: 'coexistence',
    displayPhoneNumber: '+20 100 555 0101',
    health: {
      stateReason: null,
      qualityRating: 'GREEN',
      degradedClass: null,
      lastCheckedAt: '2026-11-04T08:46:00.000Z',
    },
    setup: {
      status: 'complete',
      step: 'done',
      errorCode: null,
      retryAt: null,
      subscribedAt: '2026-11-01T08:00:00.000Z',
      numberVerifiedAt: '2026-11-01T08:00:00.000Z',
      registeredAt: '2026-11-01T08:00:00.000Z',
      completedAt: '2026-11-01T08:10:00.000Z',
    },
    templates: {
      total: 3,
      ready: 3,
      pending: 0,
      rejected: 0,
      recategorized: 0,
      retrying: 0,
      needsStaff: 0,
      drift: 0,
    },
    templateDetails: [
      templateFixture('cod_confirm.ar.standard', 'ar'),
      templateFixture('cod_confirm.en.standard', 'en'),
      templateFixture('cod_reminder.fr.standard', 'fr'),
    ],
    ...overrides,
  }
}
