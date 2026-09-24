import type { SettingsResponse } from '../api/settingsApi'

const preview = (greeting: string, body: string, confirm: string) => ({
  greeting,
  body,
  totalLabel: 'Total: {{total}}',
  ending: '',
  confirmButton: confirm,
  cancelButton: 'Cancel',
})

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
            preview: preview(
              'أهلًا بك {{customer}} 👋',
              'شكرًا لتسوّقك من {{store}}. طلبك رقم #{{order}} جاهز.',
              'تأكيد الطلب'
            ),
          },
          {
            language: 'ar',
            variant: 'egyptian',
            metaTemplateName: 'akeed_cod_verification_direct_eg',
            metaLanguageCode: 'ar_EG',
            bodyParameterOrder: ['customer', 'order', 'store', 'total'],
            preview: preview(
              'أهلًا {{customer}}،',
              'طلبك رقم #{{order}} من {{store}} مستني تأكيدك.',
              'تأكيد وشحن'
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
            preview: preview(
              'Hi {{customer}}! 👋',
              'Thank you for shopping with {{store}}.',
              'Confirm Order'
            ),
          },
        ],
      },
      previews: {
        ar: preview('أهلًا بك {{customer}}', 'شكرًا', 'تأكيد الطلب'),
        en: preview('Hi {{customer}}!', 'Thanks', 'Confirm Order'),
      },
    },
  }
}
