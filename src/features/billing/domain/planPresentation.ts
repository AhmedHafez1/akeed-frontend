/**
 * How the embedded app presents a Shopify plan. Every plan has the same
 * features and differs only in its monthly message allowance, so the Plan tab
 * and the plan picker read one model: two derived figures, one shared feature
 * list and one list of usage rules. Message keys live in
 * `billing.embeddedPlans`, except plan names (`embeddedOnboarding`).
 */
import type { ShopifyPlanId } from './shopifyPlans'

/** A paid allowance is spread over its 30-day period. */
const PERIOD_DAYS = 30
export const PER_MESSAGE_PRICE_DIGITS = 3

export const PLAN_NAME_KEYS: Record<ShopifyPlanId, string> = {
  starter: 'planStarterName',
  basic: 'planBasicName',
  pro: 'planProName',
  business: 'planBusinessName',
}

/** What one message costs on a plan, to three decimals (9.99 / 300 = 0.033). */
export function perMessagePrice(
  amount: number,
  includedVerifications: number
): number {
  if (includedVerifications <= 0) return 0
  const scale = 10 ** PER_MESSAGE_PRICE_DIGITS
  return Math.round((amount / includedVerifications) * scale) / scale
}

/** Whole messages a day the allowance covers (300 a month is 10 a day). */
export function messagesPerDay(includedVerifications: number): number {
  return Math.max(0, Math.floor(includedVerifications / PERIOD_DAYS))
}

/** `billing.embeddedPlans.features.*`, in display order. */
export const SHARED_FEATURE_KEYS = [
  'codConfirmation',
  'followUp',
  'orderUpdates',
  'quietHours',
  'officialNumber',
  'dashboard',
] as const

export type SharedFeatureKey = (typeof SHARED_FEATURE_KEYS)[number]

/** The four the plan picker has room for; its rules line covers follow-ups. */
export const COMPACT_FEATURE_KEYS: readonly SharedFeatureKey[] = [
  'codConfirmation',
  'orderUpdates',
  'quietHours',
  'officialNumber',
]

/** `billing.embeddedPlans.rules.*`, each with a `label` and a `body`. */
export const USAGE_RULE_KEYS = [
  'counted',
  'notCounted',
  'renewal',
  'atLimit',
  'planChange',
] as const

export type UsageRuleKey = (typeof USAGE_RULE_KEYS)[number]

/** Counts always use Western digits, whatever the locale. */
export function formatMessageCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

const LEFT_TO_RIGHT_ISOLATE = String.fromCharCode(0x2066)
const POP_DIRECTIONAL_ISOLATE = String.fromCharCode(0x2069)

/**
 * `<bdi dir="ltr">` for a price that has to travel inside a plain string (a
 * Polaris action label, an interpolated message), so it never reorders in
 * Arabic.
 */
export function isolateLtr(text: string): string {
  return `${LEFT_TO_RIGHT_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}`
}
