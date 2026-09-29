import { PhoneNumberType, PhoneNumberUtil } from 'google-libphonenumber'
import {
  ALLOWED_COUNTRIES,
  isValidPhoneNumber,
  type PhoneCountry,
} from '@/shared/ui/international-phone-input'
import type { OrderCurrency } from '@/shared/commerce/orderCommerce'
import {
  AUTOMATION_TIMEZONES,
  STANDALONE_STEPS,
  type AutomationTimezone,
  type IntegrationOnboardingLanguage,
  type IntegrationOnboardingState,
  type OnboardingSettingsPayload,
  type StandaloneStep,
  type StandaloneStoreFieldErrors,
  type StandaloneStoreFieldKey,
} from '@/features/onboarding/domain/onboarding.types'

const phoneUtil = PhoneNumberUtil.getInstance()

export const FALLBACK_PHONE_COUNTRY: PhoneCountry = 'EG'

/** Steps shown in the shell; the account step is always done. */
export const STANDALONE_TOTAL_STEPS = 3

/** Position of each flow step in the three-step progress (account is 1). */
export const STANDALONE_STEP_NUMBER: Record<StandaloneStep, number> = {
  store: 2,
  test: 3,
  done: 3,
}

/** DOM ids used to focus the first invalid field. */
export const STANDALONE_FIELD_IDS: Record<StandaloneStoreFieldKey, string> = {
  storeName: 'onboarding-store-name',
  merchantWhatsappPhone: 'onboarding-whatsapp-phone',
}

const FIELD_ORDER: readonly StandaloneStoreFieldKey[] = [
  'storeName',
  'merchantWhatsappPhone',
]

/**
 * What a standalone source runs with once setup is saved. Auto-verify stays
 * on because manual orders are rejected without it; the rest matches the
 * backend's provisioning defaults, sent explicitly so an older source that
 * predates them ends up the same.
 */
export const STANDALONE_SETTINGS_DEFAULTS = {
  isAutoVerifyEnabled: true,
  assumeCodWhenPaymentMissing: false,
  sendDelayMinutes: 0,
  followUpEnabled: true,
  followUpDelayMinutes: 120,
  escalationEnabled: true,
  escalationDelayMinutes: 360,
  quietHoursEnabled: false,
} as const satisfies Partial<OnboardingSettingsPayload>

export interface StandaloneStoreForm {
  storeName: string
  /** E.164, or empty while the field is blank. */
  phone: string
  /** Country chosen in the phone input, used for the "what to type" hint. */
  phoneCountry: PhoneCountry
  language: IntegrationOnboardingLanguage
  currency: OrderCurrency
  timezone: AutomationTimezone
}

export interface PhoneFormatHint {
  digits: number
  code: string
  example: string
}

export interface StoreValidationMessages {
  storeNameRequired: string
  phoneInvalid: (hint: PhoneFormatHint) => string
}

export function parseStandaloneStep(
  value: string | null | undefined
): StandaloneStep | null {
  return STANDALONE_STEPS.includes(value as StandaloneStep)
    ? (value as StandaloneStep)
    : null
}

/**
 * The step a merchant lands on. Without a saved number there is nothing to
 * test, so it is always "store". With one, the URL may choose between store
 * and test; "done" only exists right after /complete, so a pending account
 * asking for it resumes the test instead.
 */
export function resolveStandaloneStep(
  state: Pick<IntegrationOnboardingState, 'merchantWhatsappPhone'>,
  requested: StandaloneStep | null
): StandaloneStep {
  if (!state.merchantWhatsappPhone) return 'store'
  return requested === 'store' ? 'store' : 'test'
}

/** The region of the browser's language (`ar-SA` → SA), if we serve it. */
export function countryFromLanguages(
  languages: readonly string[] | undefined
): PhoneCountry {
  for (const language of languages ?? []) {
    const region = language.split('-')[1]?.toUpperCase()
    if (region && (ALLOWED_COUNTRIES as string[]).includes(region)) {
      return region as PhoneCountry
    }
  }
  return FALLBACK_PHONE_COUNTRY
}

/** Country of an E.164 number, or undefined while it cannot be parsed. */
export function countryFromPhone(phoneE164: string): PhoneCountry | undefined {
  try {
    const region = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneE164))
    return region && (ALLOWED_COUNTRIES as string[]).includes(region)
      ? (region as PhoneCountry)
      : undefined
  } catch {
    return undefined
  }
}

/** Isolates a left-to-right token (+20, 100 123 4567) inside RTL copy. */
function ltr(value: string) {
  return `⁦${value}⁩`
}

/** "1001234567" → "100 123 4567": the last four, then threes. */
function groupDigits(digits: string) {
  const groups: string[] = []
  let rest = digits
  if (rest.length > 4) {
    groups.unshift(rest.slice(-4))
    rest = rest.slice(0, -4)
  }
  while (rest.length > 3) {
    groups.unshift(rest.slice(-3))
    rest = rest.slice(0, -3)
  }
  if (rest) groups.unshift(rest)
  return groups.join(' ')
}

/**
 * How a mobile number looks in `country`: digit count after the calling
 * code, the code itself and a worked example, e.g. 10 / +20 / 100 123 4567.
 */
export function phoneFormatHint(country: PhoneCountry): PhoneFormatHint {
  const code = `+${phoneUtil.getCountryCodeForRegion(country)}`
  const example = phoneUtil.getExampleNumberForType(
    country,
    PhoneNumberType.MOBILE
  )
  if (!example) return { digits: 0, code: ltr(code), example: '' }
  const national = phoneUtil.getNationalSignificantNumber(example)
  return {
    digits: national.length,
    code: ltr(code),
    example: ltr(groupDigits(national)),
  }
}

/** "+201012345670" → "+20 101 234 5670"; anything unparseable as given. */
export function formatPhoneForDisplay(phoneE164: string): string {
  try {
    const parsed = phoneUtil.parse(phoneE164)
    return `+${parsed.getCountryCode()} ${groupDigits(
      phoneUtil.getNationalSignificantNumber(parsed)
    )}`
  } catch {
    return phoneE164
  }
}

export function validateStoreForm(
  form: StandaloneStoreForm,
  messages: StoreValidationMessages
): StandaloneStoreFieldErrors {
  const errors: StandaloneStoreFieldErrors = {}
  if (!form.storeName.trim()) errors.storeName = messages.storeNameRequired
  if (!form.phone || !isValidPhoneNumber(form.phone)) {
    const country = form.phone
      ? (countryFromPhone(form.phone) ?? form.phoneCountry)
      : form.phoneCountry
    errors.merchantWhatsappPhone = messages.phoneInvalid(
      phoneFormatHint(country)
    )
  }
  return errors
}

export function firstInvalidField(
  errors: StandaloneStoreFieldErrors
): StandaloneStoreFieldKey | null {
  return FIELD_ORDER.find((field) => !!errors[field]) ?? null
}

export function buildStoreSettingsPayload(
  form: StandaloneStoreForm
): OnboardingSettingsPayload {
  return {
    storeName: form.storeName.trim(),
    merchantWhatsappPhone: form.phone,
    defaultLanguage: form.language,
    shippingCurrency: form.currency,
    timezone: form.timezone,
    ...STANDALONE_SETTINGS_DEFAULTS,
  }
}

export function isAutomationTimezone(
  value: string | null | undefined
): value is AutomationTimezone {
  return (AUTOMATION_TIMEZONES as readonly string[]).includes(value ?? '')
}

/** "Egyptian pound (EGP)" / "جنيه مصري (ج.م)". */
export function currencyLabel(currency: string, locale: string) {
  const name =
    new Intl.DisplayNames([locale], { type: 'currency' }).of(currency) ??
    currency
  const symbol = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  })
    .formatToParts(0)
    .filter((part) => part.type === 'currency')
    .map((part) => part.value)
    .join('')
    .replace(/[‎‏؜\s]+/g, '')
    .replace(/\.$/, '')
  return symbol && symbol !== name ? `${name} (${symbol})` : name
}

/** Countries whose numbers get the Arabic template under "auto". */
const ARABIC_TEMPLATE_COUNTRIES: ReadonlySet<string> = new Set([
  'SA',
  'AE',
  'BH',
  'QA',
  'KW',
  'OM',
  'EG',
  'JO',
  'IQ',
  'SY',
  'LB',
  'PS',
  'MA',
  'DZ',
  'TN',
  'LY',
  'MR',
  'SD',
  'SO',
  'DJ',
  'KM',
  'YE',
])

/**
 * The template language a customer with this number would get, mirroring
 * the backend's `resolveTemplateLanguageForPhone` so the preview matches.
 */
export function previewLanguageFor(
  form: Pick<StandaloneStoreForm, 'language' | 'phone' | 'phoneCountry'>
): 'ar' | 'en' {
  if (form.language === 'ar' || form.language === 'en') return form.language
  const country =
    (form.phone && countryFromPhone(form.phone)) || form.phoneCountry
  return ARABIC_TEMPLATE_COUNTRIES.has(country) ? 'ar' : 'en'
}
