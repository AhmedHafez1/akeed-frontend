import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'
import type { SettingsResponse } from '../api/settingsApi'

const message = (
  greeting: string,
  body: string,
  confirm: string,
  direction: 'rtl' | 'ltr' = 'ltr'
) =>
  templateMessageFixture(
    [greeting, body, 'Total: {{total}}'],
    [confirm, 'Cancel'],
    { direction }
  )

const style = (
  language: 'ar' | 'en',
  variant: string,
  greeting: string
): SettingsResponse['template']['variants']['ar'][number] => ({
  language,
  variant,
  metaTemplateName: `template_${variant}`,
  metaLanguageCode: language,
  bodyParameterOrder: ['customer', 'store', 'order', 'total'],
  message: message(
    greeting,
    `${variant} #{{order}}`,
    'OK',
    language === 'ar' ? 'rtl' : 'ltr'
  ),
})

/** The style ids the registry is seeded with, per language. */
export const SEEDED_STYLES = {
  ar: ['standard', 'egyptian', 'gulf', 'short'],
  en: ['friendly', 'professional', 'direct', 'short'],
} as const

/**
 * A response that offers every seeded style plus `levantine`, an Arabic
 * style this app has no label for: what staff adding a template looks like.
 */
export function allStylesSettingsFixture(
  overrides: Parameters<typeof settingsResponseFixture>[0] = {}
): SettingsResponse {
  const response = settingsResponseFixture(overrides)
  return {
    ...response,
    template: {
      ...response.template,
      variants: {
        ar: [...SEEDED_STYLES.ar, 'levantine'].map((variant) =>
          style('ar', variant, `مرحبا ${variant}`)
        ),
        en: SEEDED_STYLES.en.map((variant) =>
          style('en', variant, `Hello ${variant}`)
        ),
      },
    },
  }
}

/** A GET /api/settings response for tests; override what a case needs. */
export function settingsResponseFixture(
  overrides: {
    state?: Partial<SettingsResponse['state']>
    billing?: Partial<SettingsResponse['billing']>
  } = {}
): SettingsResponse {
  return {
    state: {
      integrationId: 'int-1',
      source: { platformType: 'shopify', identity: 'test.myshopify.com' },
      onboardingStatus: 'completed',
      isOnboardingComplete: true,
      storeName: 'Togo_Test_A',
      defaultLanguage: 'auto',
      isAutoVerifyEnabled: true,
      assumeCodWhenPaymentMissing: false,
      shippingCurrency: 'USD',
      avgShippingCost: 3,
      billingPlanId: 'starter',
      billingStatus: 'active',
      billingManagement: { mode: 'shopify', canManageBilling: true },
      followUpEnabled: true,
      followUpDelayMinutes: 360,
      escalationEnabled: true,
      escalationDelayMinutes: 1080,
      quietHoursEnabled: true,
      quietHoursStart: '21:00',
      quietHoursEnd: '09:00',
      timezone: 'Africa/Cairo',
      shopTimezone: 'Africa/Cairo',
      sendDelayMinutes: 0,
      merchantWhatsappPhone: '+201001234567',
      testSendLanguage: 'ar',
      permissions: {
        canUpdateConfiguration: true,
        canCompleteOnboarding: false,
      },
      standaloneSetup: null,
      ...overrides.state,
    },
    billing: {
      plans: [
        {
          id: 'starter',
          name: 'Akeed Starter',
          amount: 0,
          currencyCode: 'USD',
          includedVerifications: 30,
        },
        {
          id: 'basic',
          name: 'Akeed Basic',
          amount: 9.99,
          currencyCode: 'USD',
          includedVerifications: 300,
        },
        {
          id: 'pro',
          name: 'Akeed Pro',
          amount: 22.99,
          currencyCode: 'USD',
          includedVerifications: 1000,
        },
        {
          id: 'business',
          name: 'Akeed Scale',
          amount: 49.99,
          currencyCode: 'USD',
          includedVerifications: 2500,
        },
      ],
      isFreePlanClaimed: true,
      usage: {
        used: 27,
        limit: 30,
        periodStart: '2026-09-01',
        periodEnd: null,
      },
      messagesSentLast30Days: 28,
      ...overrides.billing,
    },
    template: {
      languages: ['ar', 'en'],
      defaultPreviewLanguage: 'en',
      defaults: { ar: 'standard', en: 'friendly' },
      selected: { ar: 'standard', en: 'friendly' },
      variants: {
        ar: [
          {
            language: 'ar',
            variant: 'standard',
            metaTemplateName: 'akeed_cod_verification_friendly',
            metaLanguageCode: 'ar',
            bodyParameterOrder: ['customer', 'store', 'order', 'total'],
            message: message(
              'أهلًا بك {{customer}} 👋',
              'شكرًا لتسوّقك من {{store}}. طلبك رقم #{{order}} جاهز.',
              'تأكيد الطلب',
              'rtl'
            ),
          },
          {
            language: 'ar',
            variant: 'egyptian',
            metaTemplateName: 'akeed_cod_verification_direct_eg',
            metaLanguageCode: 'ar_EG',
            bodyParameterOrder: ['customer', 'order', 'store', 'total'],
            message: message(
              'أهلًا {{customer}}،',
              'طلبك رقم #{{order}} من {{store}} مستني تأكيدك.',
              'تأكيد وشحن',
              'rtl'
            ),
          },
        ],
        en: [
          {
            language: 'en',
            variant: 'friendly',
            metaTemplateName: 'akeed_cod_verification_friendly',
            metaLanguageCode: 'en',
            bodyParameterOrder: ['customer', 'store', 'order', 'total'],
            message: message(
              'Hi {{customer}}! 👋',
              'Thank you for shopping with {{store}}.',
              'Confirm Order'
            ),
          },
        ],
      },
      messages: {
        ar: message('أهلًا بك {{customer}}', 'شكرًا', 'تأكيد الطلب', 'rtl'),
        en: message('Hi {{customer}}!', 'Thanks', 'Confirm Order'),
      },
    },
  }
}
