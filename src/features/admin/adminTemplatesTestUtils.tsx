import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../test/vitest/setup'
import ar from '../../../public/messages/ar.json'
import en from '../../../public/messages/en.json'
import type {
  TemplateAuthoringContext,
  TemplateDraft,
  TemplateDraftListResponse,
  TemplateImpact,
} from './admin-template-drafts.model'
import type {
  TemplateContext,
  TemplateDetailResponse,
  TemplateListResponse,
  TemplateSummary,
} from './admin-templates.model'

/**
 * Renders an admin page with the real messages in one locale. A missing
 * translation key throws, so a test fails instead of showing the key.
 */
export function renderAdmin(ui: ReactElement, lang: 'ar' | 'en' = 'ar') {
  testLocale.current = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  return render(
    <NextIntlClientProvider
      locale={lang}
      messages={lang === 'ar' ? ar : en}
      timeZone="UTC"
      onError={(error) => {
        throw error
      }}
    >
      {ui}
    </NextIntlClientProvider>
  )
}

export function templateSummary(
  overrides: Partial<TemplateSummary> = {}
): TemplateSummary {
  return {
    key: 'cod_confirm.ar.standard',
    purpose: 'cod_confirmation',
    language: 'ar',
    style: 'standard',
    template_name: 'akeed_cod_verification_friendly',
    language_code: 'ar',
    parameter_format: 'named',
    review_status: 'approved',
    category: 'utility',
    pending_category: null,
    quality: 'pending',
    is_active: true,
    is_default: true,
    sendable: true,
    last_synced_at: '2026-10-05T19:57:00.000Z',
    active_store_count: 12,
    drift: { state: 'in_sync', kinds: [], severity: null },
    metrics: {
      sends: 40,
      delivered: 38,
      read: 31,
      replies: 25,
      confirmed: 21,
      canceled: 4,
      no_reply: 6,
      reply_rate: 0.625,
      confirmation_rate: 0.525,
    },
    ...overrides,
  }
}

export function templateContext(
  overrides: Partial<TemplateContext> = {}
): TemplateContext {
  return {
    range: { from: '2026-09-06', to: '2026-10-05', timezone: 'UTC' },
    sync: { enabled: true, guardrail_enabled: false, last_run: null },
    operations: { enabled: true, operator: true, test_send_available: true },
    evaluated_at: '2026-10-05T20:00:00.000Z',
    ...overrides,
  }
}

export function templateList(
  templates: TemplateSummary[],
  context: Partial<TemplateContext> = {}
): TemplateListResponse {
  return { ...templateContext(context), templates }
}

export function templateDetail(
  overrides: Partial<TemplateDetailResponse> = {}
): TemplateDetailResponse {
  return {
    ...templateContext(),
    template: {
      ...templateSummary(),
      provider_template_id: '900000000000007',
      text_changed_at: null,
    },
    message: {
      paragraphs: [
        'أهلاً بك أحمد! 👋',
        'شكراً لتسوقك من متجر أكيد.',
        'طلبك رقم #TEST-1 بقيمة 250.00 USD جاهز تقريباً للشحن!',
      ],
      buttons: [
        { label: 'تأكيد الطلب', kind: 'quick_reply' },
        { label: 'إلغاء الطلب', kind: 'quick_reply' },
      ],
      direction: 'rtl',
    },
    registered_preview: {
      paragraphs: ['أهلًا بك أحمد 👋', 'إجمالي الطلب: 250.00 USD'],
      buttons: [
        { label: 'تأكيد الطلب', kind: 'quick_reply' },
        { label: 'إلغاء الطلب', kind: 'quick_reply' },
      ],
      direction: 'rtl',
    },
    variables: [
      { variable: 'customer', parameter: 'customer', sample: 'أحمد' },
      { variable: 'store', parameter: 'store', sample: 'متجر أكيد' },
      { variable: 'order', parameter: 'order', sample: 'TEST-1' },
      { variable: 'total', parameter: 'total', sample: '250.00 USD' },
    ],
    drift: { state: 'in_sync', kinds: [], severity: null, differences: [] },
    history: { events: [], sync_runs: [] },
    stores: { total: 0, shown: [] },
    metrics_by_purpose: [],
    ...overrides,
  }
}

export function authoringContext(
  overrides: Partial<TemplateAuthoringContext> = {}
): TemplateAuthoringContext {
  return {
    operations: { enabled: true, operator: true },
    environment: { production: false, account_suffix: '0001' },
    options: {
      purposes: ['cod_confirmation'],
      language_codes: {
        ar: ['ar', 'ar_EG', 'ar_AE'],
        en: ['en', 'en_US', 'en_GB'],
      },
      variables: ['customer', 'store', 'order', 'total'],
      sample_defaults: {
        ar: {
          customer: 'أحمد',
          store: 'متجر أكيد',
          order: 'TEST-1',
          total: '250.00 USD',
        },
        en: {
          customer: 'Ahmed',
          store: 'Akeed Store',
          order: 'TEST-1',
          total: '250.00 USD',
        },
      },
      category: { cod_confirmation: 'utility' },
      limits: { body: 1024, button_label: 25, style: 24 },
      review_max_hours: 24,
    },
    ...overrides,
  }
}

export function templateDraft(
  overrides: Partial<TemplateDraft> = {}
): TemplateDraft {
  return {
    id: '3f1b6c1e-2d4a-4c3b-9a8e-1f2e3d4c5b6a',
    key: 'cod_confirm.en.warm_v1',
    purpose: 'cod_confirmation',
    language: 'en',
    style: 'warm',
    version: 1,
    template_name: 'akeed_cod_confirm_warm_v1',
    language_code: 'en',
    parameter_format: 'named',
    category: 'utility',
    body: 'Hello {{customer}}, please confirm your order {{order}} from our store today.',
    confirm_label: 'Confirm order',
    cancel_label: 'Cancel order',
    samples: { customer: 'Ahmed', order: 'TEST-1' },
    state: 'draft',
    state_changed_at: '2026-10-06T08:00:00.000Z',
    last_error_code: null,
    template_key: null,
    created_at: '2026-10-06T08:00:00.000Z',
    updated_at: '2026-10-06T08:00:00.000Z',
    variables: [
      { variable: 'customer', parameter: 'customer', sample: 'Ahmed' },
      { variable: 'order', parameter: 'order', sample: 'TEST-1' },
    ],
    validation: { valid: true, issues: [] },
    preview: {
      paragraphs: [
        'Hello Ahmed, please confirm your order TEST-1 from our store today.',
      ],
      buttons: [
        { label: 'Confirm order', kind: 'quick_reply' },
        { label: 'Cancel order', kind: 'quick_reply' },
      ],
      direction: 'ltr',
    },
    ...overrides,
  }
}

export function templateDraftList(
  drafts: TemplateDraft[] = [],
  context: Partial<TemplateAuthoringContext> = {}
): TemplateDraftListResponse {
  return { ...authoringContext(context), drafts }
}

export function templateImpact(
  overrides: Partial<TemplateImpact> = {}
): TemplateImpact {
  return {
    key: 'cod_confirm.ar.egyptian',
    is_active: true,
    is_default: false,
    retired: false,
    review_status: 'approved',
    rejection_reason: null,
    stores: { total: 12, active: 11 },
    requires_replacement: true,
    replacements: [
      {
        key: 'cod_confirm.ar.standard',
        style: 'standard',
        template_name: 'akeed_cod_verification_friendly',
      },
    ],
    edit: {
      allowed: false,
      refusal: 'in_use',
      rule: '4.3.9',
      draft_id: null,
      edits_last_day: 0,
      edits_last_30_days: 0,
      limits: { per_day: 1, per_30_days: 10 },
    },
    ...overrides,
  }
}
