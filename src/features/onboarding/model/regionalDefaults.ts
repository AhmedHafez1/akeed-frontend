import { PhoneNumberUtil } from 'google-libphonenumber'
import {
  currencyForCountry,
  type OrderCurrency,
} from '@/shared/commerce/orderCommerce'
import {
  AUTOMATION_TIMEZONES,
  type AutomationTimezone,
} from '@/features/onboarding/domain/onboarding.types'

const phoneUtil = PhoneNumberUtil.getInstance()

const FALLBACK_CURRENCY: OrderCurrency = 'USD'
const FALLBACK_TIMEZONE: AutomationTimezone = 'Asia/Riyadh'

/** Each served market's own automation timezone, keyed by ISO country. */
const COUNTRY_TIMEZONES: Readonly<Record<string, AutomationTimezone>> = {
  EG: 'Africa/Cairo',
  SA: 'Asia/Riyadh',
  AE: 'Asia/Dubai',
  QA: 'Asia/Qatar',
  KW: 'Asia/Kuwait',
  BH: 'Asia/Bahrain',
  OM: 'Asia/Muscat',
  JO: 'Asia/Amman',
  MA: 'Africa/Casablanca',
}

function isAutomationTimezone(value: string): value is AutomationTimezone {
  return (AUTOMATION_TIMEZONES as readonly string[]).includes(value)
}

/** ISO country from an E.164 phone number, or undefined if unparseable. */
function countryFromPhone(phoneE164: string): string | undefined {
  try {
    const parsed = phoneUtil.parse(phoneE164)
    return phoneUtil.getRegionCodeForNumber(parsed) ?? undefined
  } catch {
    return undefined
  }
}

export interface RegionalDefaultsInput {
  phoneE164?: string
  /** ISO country to fall back on while the number cannot be parsed yet. */
  countryHint?: string
  browserTimeZone?: string
}

export interface RegionalDefaults {
  country: string | undefined
  currency: OrderCurrency
  timezone: AutomationTimezone
}

/**
 * The merchant's likely country, currency and automation timezone, guessed
 * from their WhatsApp number and browser — so onboarding can pre-fill the
 * "Your store" step instead of asking. Never throws.
 */
export function inferRegionalDefaults({
  phoneE164,
  countryHint,
  browserTimeZone,
}: RegionalDefaultsInput): RegionalDefaults {
  const country =
    (phoneE164 ? countryFromPhone(phoneE164) : undefined) ??
    countryHint?.toUpperCase()
  const currency = country
    ? (currencyForCountry(country) ?? FALLBACK_CURRENCY)
    : FALLBACK_CURRENCY

  const timezone =
    browserTimeZone && isAutomationTimezone(browserTimeZone)
      ? browserTimeZone
      : (country && COUNTRY_TIMEZONES[country]) || FALLBACK_TIMEZONE

  return { country, currency, timezone }
}
