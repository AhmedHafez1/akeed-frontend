/**
 * Shopify subscription plans as the embedded app offers them. Onboarding no
 * longer picks a plan (Starter is granted at setup), so these live with
 * billing and are shown from the dashboard when usage or a reinstall calls for
 * them.
 */
export const SHOPIFY_PLAN_IDS = ['starter', 'basic', 'pro', 'business'] as const

export type ShopifyPlanId = (typeof SHOPIFY_PLAN_IDS)[number]

export interface ShopifyPlanConfig {
  id: ShopifyPlanId
  name: string
  amount: number
  currencyCode: string
  includedVerifications: number
}

export interface ShopifyPlansResponse {
  billingManagement?: { mode: 'shopify' | 'manual'; canManageBilling: boolean }
  plans: ShopifyPlanConfig[]
  isFreePlanClaimed: boolean
}

/** A plan ready to render: every label already translated. */
export interface ShopifyPlanCard {
  id: ShopifyPlanId
  name: string
  monthlyPriceLabel: string
  monthlyVolumeLabel: string
  subtitle: string
  features: string[]
  ctaLabel: string
}

type PlanMessageKey = `plan${'Starter' | 'Basic' | 'Pro' | 'Business'}${
  | 'Name'
  | 'Price'
  | 'Volume'
  | 'Subtitle'
  | 'Cta'}`

interface PlanDefinition {
  id: ShopifyPlanId
  nameKey: PlanMessageKey
  priceKey: PlanMessageKey
  volumeKey: PlanMessageKey
  subtitleKey: PlanMessageKey
  ctaKey: PlanMessageKey
  featureKeys: string[]
}

function definePlan(
  id: ShopifyPlanId,
  prefix: 'Starter' | 'Basic' | 'Pro' | 'Business',
  featureCount: number
): PlanDefinition {
  return {
    id,
    nameKey: `plan${prefix}Name`,
    priceKey: `plan${prefix}Price`,
    volumeKey: `plan${prefix}Volume`,
    subtitleKey: `plan${prefix}Subtitle`,
    ctaKey: `plan${prefix}Cta`,
    featureKeys: Array.from(
      { length: featureCount },
      (_, index) => `plan${prefix}Feature${index + 1}`
    ),
  }
}

/** Message keys live in the `embeddedOnboarding` namespace. */
export const SHOPIFY_PLAN_DEFINITIONS: PlanDefinition[] = [
  definePlan('starter', 'Starter', 4),
  definePlan('basic', 'Basic', 5),
  definePlan('pro', 'Pro', 4),
  definePlan('business', 'Business', 5),
]

export const RECOMMENDED_SHOPIFY_PLAN_ID: ShopifyPlanId = 'pro'
