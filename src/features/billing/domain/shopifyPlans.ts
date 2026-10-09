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

/**
 * A plan ready to render: the API's price and allowance with the translated
 * name in place of Shopify's invoice name.
 */
export type ShopifyPlanCard = ShopifyPlanConfig
