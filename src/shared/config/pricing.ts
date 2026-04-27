export const PRICING_FEATURE_INDICES = [1, 2, 3, 4, 5, 6] as const

export function getPricingFeatureKey(planId: string, featureIndex: number): string {
  return `${planId}_feature_${featureIndex}`
}