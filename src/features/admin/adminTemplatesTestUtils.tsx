import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../test/vitest/setup'
import ar from '../../../public/messages/ar.json'
import en from '../../../public/messages/en.json'
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
